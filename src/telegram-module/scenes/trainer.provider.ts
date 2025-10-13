import {
  Scene,
  SceneEnter,
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

import type { TMessageType } from '../types/message';
import { ChatProvider } from '../../chat-module/chat.provider';
import { TMessageData } from '../../services/types';
import { Context } from '../../context-module/context.model';

function prepareText(result: any) {
  const arrayText = result.choices[0].message.content
    .replace('```json', '')
    .replace('```', '');

  return JSON.parse(arrayText)
    .reduce((acc, item) => {
      const { title, description } = item;

      acc += `*${title}*\n\n${description}\n\n`;

      return acc;
    }, '')
    .replaceAll('(', '\\(')
    .replaceAll(')', '\\)')
    .replaceAll('.', '\\.')
    .replaceAll('+', '\\+')
    .replaceAll('!', '\\!')
    .replaceAll('-', '\\-');
}

@Scene('TRAINER_SCENE_ID')
export class TrainerProvider {
  constructor(
    private contextProvider: ContextProvider,
    private chatProvider: ChatProvider,
    private openRouterProvider: OpenRouterProvider,
    private logger: LoggerProvider,
  ) {}

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: Scenes.SceneContext) {
    await ctx.replyWithMarkdownV2('🎛️', {
      reply_markup: {
        keyboard: [[{ text: '📱️Меню' }], [{ text: '📚 Теория' }]],
        resize_keyboard: true,
        one_time_keyboard: false,
      },
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const { contextName } = ctx.scene.state;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    ctx.session.contextName = contextName;

    const context = await this.contextProvider.getOneByAlias(contextName);

    if (!context) {
      throw new Error(`Context not found: ${contextName}`);
    }

    await ctx.replyWithMarkdownV2(
      'Я \\- ИИ тренажер 🤓\n' +
        'Буду присылать Вам сообщение на русском языке\n' +
        `Ваша задача перевести предложение в соотвествие с темой *"${context.name}"*\\.\n` +
        'Удачи\\!',
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '✅ Начем?',
                callback_data: 'get_exercise',
              },
            ],
          ],
        },
      },
    );
  }

  @On('text')
  async answerAnswer(
    @Ctx() ctx: Scenes.SceneContext,
    @Next() next: any,
    @Message('') message: TMessageType,
  ) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const contextName = ctx.session.contextName;

    const context = await this.contextProvider.getOneByAlias(contextName);

    if (!context) {
      throw new Error(`Context not found: ${contextName}`);
    }

    if (message.text === '📱️Меню') {
      await next();

      return;
    }

    if (message.text === '📚 Теория') {
      await this.prepareRule(ctx, context);
      await next();

      return;
    }

    const chatId: number =
      (ctx.update as any)?.message?.chat?.id ||
      (ctx.update as any)?.callback_query?.message?.chat?.id;

    const record = await this.chatProvider.getLastQuestion(
      chatId,
      context._id.toString(),
    );

    const messageData: TMessageData[] = [];

    if (record) {
      messageData.push({
        type: 'text',
        text: `Правильно ли выполнен перевод фразы: "${record.question}" на английский: ${message.text}`,
      });
    } else {
      messageData.push({
        type: 'text',
        text: message.text,
      });
    }

    const result = await this.openRouterProvider.sendMessage(
      context.promptAnswer,
      messageData,
    );

    const clearedMessage = result.choices[0].message.content
      .replace('```json', '')
      .replace('```', '');

    try {
      const parsedMessage: { title: string; description: string } =
        JSON.parse(clearedMessage);

      const clearedDescription = parsedMessage.description
        .replaceAll('(', '\\(')
        .replaceAll(')', '\\)')
        .replaceAll('.', '\\.')
        .replaceAll('+', '\\+')
        .replaceAll('-', '\\-');

      await ctx.replyWithMarkdownV2(clearedDescription, {
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

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const contextName = ctx.session.contextName;

    const context = await this.contextProvider.getOneByAlias(contextName);

    if (!context) {
      throw new Error(`Context not found: ${contextName}`);
    }

    const chatId: number =
      (ctx.update as any)?.message?.chat?.id ||
      (ctx.update as any)?.callback_query?.message?.chat?.id;

    const records = await this.chatProvider.getRecords(
      chatId,
      context._id.toString(),
    );

    const constraintPrompt =
      'Пример не должен быть одним из списка: ' + records.join('.\n');

    const result = await this.openRouterProvider.sendMessage(
      context.promptQuestion,
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
      const parsedMessage: { title: string; text: string } =
        JSON.parse(clearedMessage);

      await this.chatProvider.addRecord(chatId, context._id.toString(), {
        question: parsedMessage.text,
      });

      await ctx.reply(`${parsedMessage.text.trim()}`);
    } catch (e) {
      this.logger.error(`${this.constructor.name} onTrainer: ${e}`);

      await ctx.reply('Я не понял ответ, давай попробуем другое предложение', {
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

  private async prepareRule(
    ctx: Scenes.SceneContext,
    context: Context & { _id: mongoose.Types.ObjectId },
  ) {
    const awaitingMessage = await ctx.reply(
      'Пару мгновений, готовлю краткую справку️ ⏱️⏱️⏱️',
    );

    let rule: string = context.rule;

    if (!context.rule) {
      const result = await this.openRouterProvider.sendMessage(
        context.promptRule,
      );

      rule = prepareText(result);

      await this.contextProvider.updateOne({ _id: context._id }, { rule });
    }

    await ctx.deleteMessage(awaitingMessage.message_id);

    await ctx.replyWithMarkdownV2(rule, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Новое предложение?',
              callback_data: 'get_exercise',
            },
          ],
        ],
      },
    });
  }
}
