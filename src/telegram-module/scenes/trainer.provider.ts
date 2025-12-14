import {
  Scene,
  SceneEnter,
  SceneLeave,
  Ctx,
  Action,
  On,
  Message,
  Next,
} from 'nestjs-telegraf';
import { Scenes } from 'telegraf';
import mongoose from 'mongoose';

import { ContextProvider } from '../../context-module/context.provider';
import { OpenRouterProvider } from '../../services/providers';
import { LoggerProvider } from '../../logger-module/logger.provider';

import { ChatProvider } from '../../chat-module/chat.provider';
import { Context } from '../../context-module/context.model';
import { ExercisesProvider } from '../../exercises-module/exercises.provider';
import { SubscriptionProvider } from '../../subscription-module/subscription.provider';
import { escapeText } from '../libs/text-format';
import { MessageCleanerService } from '../message-cleaner.service';

import type { InlineKeyboardButton } from '@telegraf/types';
import type { TMessageType } from '../types/message';
import type { TMessageData } from '../../services/types';

function prepareText(result: any) {
  const arrayText = result.choices[0].message.content
    .replace('```json', '')
    .replace('```', '');

  const parsedText = JSON.parse(arrayText)
    .reduce((acc, item) => {
      const { title, description } = item;

      acc += `*${title}*\n\n${description}\n\n`;

      return acc;
    }, '');

    return escapeText(parsedText);
}

@Scene('TRAINER_SCENE_ID')
export class TrainerProvider {
  constructor(
    private contextProvider: ContextProvider,
    private exercisesProvider: ExercisesProvider,
    private subscritionProvider: SubscriptionProvider,
    private chatProvider: ChatProvider,
    private openRouterProvider: OpenRouterProvider,
    private logger: LoggerProvider,
    private messageCleanerService: MessageCleanerService,
  ) {}

  @SceneLeave()
  async onSceneLeave(@Ctx() ctx: Scenes.SceneContext) {
    const session = ctx.session as any;
    
    // Очищаем данные сессии
    delete session.contextName;
    delete session.exerciseType;
    delete session.modification;
    
    // Очищаем состояние сцены
    ctx.scene.state = {};
  }
  
  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: Scenes.SceneContext) {
    await ctx.replyWithMarkdownV2('🎛️', {
      reply_markup: {
        keyboard: [
          [{ text: '📱️ Меню' }],
          // [{ text: '📚 Теория' }]
          ],
        resize_keyboard: true,
        one_time_keyboard: false,
      },
    });

    
    const { contextName } = ctx.scene.state as any;

    (ctx.session as any).contextName = contextName;

    const context = await this.contextProvider.getOneByAlias(contextName);

    if (!context) {
      await ctx.reply('Не удалось загрузить тему 😞');

      await ctx.scene.leave();
      await ctx.scene.enter('MENU_SCENE_ID');

      return;
    }

    const chatId: number =
      (ctx.update as any)?.message?.chat?.id ||
      (ctx.update as any)?.callback_query?.message?.chat?.id;

    const hasActiveSubscription =
      await this.subscritionProvider.hasActiveSubscription(chatId);

    if (!hasActiveSubscription && !context.isFree) {
      await ctx.scene.leave();
      await ctx.scene.enter('PAYMENT_SCENE_ID');

      return;
    }

    await this.getExerciseMenuButtons(ctx, context);
  }

  @On('text')
  async answerAnswer(
    @Ctx() ctx: Scenes.SceneContext,
    @Next() next: any,
    @Message('') message: TMessageType,
  ) {
    if (this.isMenuMessage(message)) {
      await this.processMenuMessage(ctx, next, message);

      return;
    }

    const contextName = (ctx.session as any).contextName;
    const exerciseType = (ctx.session as any).exerciseType;

    const context = await this.contextProvider.getOneByAlias(contextName);

    if (!context) {
      throw new Error(`Context not found: ${contextName}`);
    }

    const chatId: number =
      (ctx.update as any)?.message?.chat?.id ||
      (ctx.update as any)?.callback_query?.message?.chat?.id;

    try {
      const exercise = await this.exercisesProvider.getOneByAlias(exerciseType);

      if (!exercise) {
        throw new Error(`Exercise not found (alias=${exerciseType})`);
      }

      const record = await this.chatProvider.getLastQuestion(
        chatId,
        context._id.toString(),
        exercise._id.toString(),
      );

      const messageData: TMessageData[] = [];

      if (record) {
        messageData.push({
          type: 'text',
          text: JSON.stringify({ question: record.question, answer: message.text }),
        });
      } else {
        messageData.push({
          type: 'text',
          text: message.text,
        });
      }

      const result = await this.openRouterProvider.sendMessage(
        context.promptQuestion + ' ' + exercise.promptAnswer,
        messageData,
      );

      const clearedMessage = result.choices[0].message.content
        .replace('```json', '')
        .replace('"', '\"')
        .replace('```', '');

      const parsedMessage: { title: string; description: string } =
        JSON.parse(clearedMessage);

      const clearedDescription = escapeText(parsedMessage.description);
        

      const newSentence = await ctx.replyWithMarkdownV2(clearedDescription, {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Новое предложение?',
                callback_data: 'get_exercise:delete',
              },
            ],
          ],
        },
      });
    } catch (e) {
      this.logger.error(`${this.constructor.name} answerAnswer: ${e}`);

      await ctx.replyWithMarkdownV2(
        'Я не понял ответ, давай попробуем другое предложение',
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'Новое предложение?',
                  callback_data: 'get_exercise:delete',
                },
              ],
            ],
          },
        },
      );
    }
  }

  @Action(/^set_exercise(?::\w+)?$/)
  async onExercise(
    @Ctx() ctx: Scenes.SceneContext & { update: { callback_query: any } },
  ) {

    try {
      await ctx.deleteMessage(undefined);
    } catch (e) {}

    const action = ctx.update.callback_query?.data;
    const value = action.split(':')[1];

    (ctx.session as any).exerciseType = value;

    const exercise = await this.exercisesProvider.getOneByAlias(value);

    if (!exercise) {
      await ctx.reply('Не удалось загрузить тему 😞');

      await ctx.scene.leave();
      await ctx.scene.enter('MENU_SCENE_ID');

      return;
    }

    await ctx.replyWithMarkdownV2('🎛️', {
      reply_markup: {
        keyboard: [[{ text: '🤓 Выбрать упражнение' }], [{ text: '📱️ Меню' }]],
        resize_keyboard: true,
        one_time_keyboard: false,
      },
    });

    if (exercise.modifications.length <= 1) {
      try {
        await ctx.editMessageReplyMarkup(undefined);
      } catch (e) {}

      const message = await ctx.reply('Окей, тема выбрана.\n\n' + exercise.description, {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '✅ Начем?',
                callback_data: 'get_exercise:delete',
              },
            ],
          ],
        },
      });

      await this.messageCleanerService.saveReply(ctx, message);

      return;
    }

    // Создаем кнопки модификаторов
    const modificationButtons: InlineKeyboardButton[][] = [];
    const modificationLabels: Record<string, string> = {
      affirmative: '✅ Утвердительное',
      negative: '❌ Отрицательное',
      question: '❓ Вопросительное',
      none: '🔥 Все типы',
    };

    for (let i = 0; i < exercise.modifications.length; i += 2) {
      const row: InlineKeyboardButton[] = [];

      const mod1 = exercise.modifications[i];
      row.push({
        text: modificationLabels[mod1] || mod1,
        callback_data: `set_modification:${mod1}`,
      });

      if (exercise.modifications[i + 1]) {
        const mod2 = exercise.modifications[i + 1];
        row.push({
          text: modificationLabels[mod2] || mod2,
          callback_data: `set_modification:${mod2}`,
        });
      }

      modificationButtons.push(row);
    }

    await this.messageCleanerService.deletePrev(ctx);

    const message = await ctx.reply('Выберите модификатор', {
      reply_markup: {
        inline_keyboard: modificationButtons,
      },
    });

    await this.messageCleanerService.saveReply(ctx, message);
  }
  
  @Action(/^set_modification(?::\w+)?$/)
  async onModification(
    @Ctx() ctx: Scenes.SceneContext & { update: { callback_query: any } },
  ) {
    try {
      await ctx.deleteMessage();
    } catch (e) {
      this.logger.error(`${this.constructor.name} onModification error:`, e);
    
    }

    const action = ctx.update.callback_query?.data;
    const modification = action.split(':')[1];

    (ctx.session as any).modification = modification;

    const message = await ctx.reply('Окей, тема выбрана', {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '✅ Начем?',
              callback_data: 'get_exercise:delete',
            },
          ],
        ],
      },
    });

    await this.messageCleanerService.saveReply(ctx, message);
  }

  @Action(/^get_exercise(?::\w+)?$/)
  async onTrainer(
    @Ctx() ctx: Scenes.SceneContext & { update: { callback_query: any } },
  ) {
    const action = ctx.update.callback_query?.data;
    const value = action.split(':')[1];
    try {
      switch (value) {
        case 'delete':
          await ctx.deleteMessage();
          break;
        default:
          await ctx.editMessageReplyMarkup(undefined);
      }
    } catch (e) {
      this.logger.error(`${this.constructor.name} onTrainer error:`, e);
    }

    const contextName = (ctx.session as any).contextName;
    const exerciseType = (ctx.session as any).exerciseType;

    const context = await this.contextProvider.getOneByAlias(contextName);

    if (!context) {
      throw new Error(`Context not found: ${contextName}`);
    }

    const exercise = await this.exercisesProvider.getOneByAlias(exerciseType);

    if (!exercise) {
      await ctx.reply('Не удалось загрузить тему 😞');

      await ctx.scene.leave();
      await ctx.scene.enter('MENU_SCENE_ID');

      return;
    }

    const chatId: number =
      (ctx.update as any)?.message?.chat?.id ||
      (ctx.update as any)?.callback_query?.message?.chat?.id;

    const records = await this.chatProvider.getRecords(
      chatId,
      context._id.toString(),
      exercise._id.toString(),
    );

    const constraintPrompt =
      'Пример не должен быть одним из списка или похожим на него: ' + records.filter(Boolean).join(' \n ');

    const modificationType = (ctx.session as any).modification;

    let sentenceStyle = 'утвердительным, отрицательным или вопросительным';

    if (modificationType === 'affirmative') {
      sentenceStyle = 'утвердительное';
    } else if (modificationType === 'negative') {
      sentenceStyle = 'отрицательное';
    } else if (modificationType === 'question') {
      sentenceStyle = 'вопросительное';
    }

    const replacedPrompt = exercise.promptQuestion.replace('%replacement_1%', sentenceStyle);
    const result = await this.openRouterProvider.sendMessage(
      context.promptQuestion + ' ' + replacedPrompt,
      [
        {
          text: constraintPrompt,
          type: 'text',
        },
      ],
    );

    const clearedMessage = result.choices[0].message.content
      .replace('```json', '')
      .replace('```', '');

    try {
      const parsedMessage: { title: string; text: string, answer: string } =
        JSON.parse(clearedMessage);

      await this.chatProvider.addRecord(
        chatId,
        context._id.toString(),
        exercise._id.toString(),
        {
          question: parsedMessage.text,
          answer: parsedMessage.answer,
        },
      );

      // await ctx.reply(`${parsedMessage.text.trim()}\n\n ${parsedMessage.answer}`);
      await ctx.reply(`${parsedMessage.text.trim()}`);
    } catch (e) {
      this.logger.error(`${this.constructor.name} onTrainer: ${e}`);

      await ctx.reply('Я не понял ответ, давай попробуем другое предложение2', {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Новое предложение?',
                callback_data: 'get_exercise:delete',
              },
            ],
          ],
        },
      });
    }
  }

  private async getExerciseMenuButtons(ctx: Scenes.SceneContext, context: Context & { _id: mongoose.Types.ObjectId }) {
    const exercises = await this.exercisesProvider.getByCodes(
      context.exercises,
    );

    if (!exercises.length) {
      const message = await ctx.reply('Окей, тема выбрана', {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '✅ Начем?',
                callback_data: 'get_exercise:delete',
              },
            ],
          ],
        },
      });

      await this.messageCleanerService.saveReply(ctx, message);

      return;
    }
    
    const exercisesButtons: InlineKeyboardButton[][] = [];

    for (let i = 0; i < exercises.length; i += 2) {
      const row: InlineKeyboardButton[] = [];

      row.push({
        text: exercises[i].name,
        callback_data: `set_exercise:${exercises[i].alias}`,
      });

      if (exercises[i + 1]) {
        row.push({
          text: exercises[i + 1].name,
          callback_data: `set_exercise:${exercises[i + 1].alias}`,
        });
      }

      exercisesButtons.push(row);
    }

    if (!exercisesButtons.length) {
      await ctx.reply('Не удалось загрузить тему 😞');

      await ctx.scene.leave();
      await ctx.scene.enter('MENU_SCENE_ID');

      return;
    }

    await this.messageCleanerService.deletePrev(ctx);

    const message = await ctx.replyWithMarkdownV2('Выберите тип упражнения', {
      reply_markup: {
        inline_keyboard: exercisesButtons,
      },
    });

    await this.messageCleanerService.saveReply(ctx, message);
  }

  private isMenuMessage(message: TMessageType) {
    return ['📱️ Меню', '🤓 Выбрать упражнение', '📚 Теория'].includes(message.text);
  }

  private async processMenuMessage(ctx: Scenes.SceneContext, @Next() next: any, message: TMessageType) {
    const contextName = (ctx.session as any).contextName;
    const context = await this.contextProvider.getOneByAlias(contextName);
    
    if (!context) {
      throw new Error(`Context not found: ${contextName}`);
    }

    await this.messageCleanerService.deletePrev(ctx);
    
    if (message.text === '📱️ Меню') {
      await next();

      return;
    }

    if (message.text === '🤓 Выбрать упражнение') {
      try {
        await ctx.deleteMessage();
      } catch (e) {}

      await this.getExerciseMenuButtons(ctx, context);
      await next();

      return;
    }

    // if (message.text === '📚 Теория') {
    //   await this.prepareRule(ctx, context);
    //   await next();

    //   return;
    // }
  }
}
