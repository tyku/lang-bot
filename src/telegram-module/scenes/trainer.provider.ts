import { Scene, SceneEnter, Ctx, Action, On, Message } from 'nestjs-telegraf';
import { Scenes } from 'telegraf';

import { ContextProvider } from '../../context-module/context.provider';
import { OpenRouterProvider } from '../../services/providers';
import { LoggerProvider } from '../../logger-module/logger.provider';

import type { TMessageType } from '../types/message';

const readyText = [
  '🤓 Хочу узнать, как это предложение звучит по-английски!',
  '🌍 Переведи это предложение на английский',
  '📚 Переводим предложение на английский вместе!',
  '🧠 Эй, переведи эту фразу на инглиш, плиз!',
  '🤙 Йо, закинь мне перевод на английский, окей?',
  '📚 Что там по переводу на English?',
  '📲 Скинь, как это будет по-английски, интересно же! 😜',
  '💭 Как это по-английски будет звучать? Переведи, плиз 🙏',
];

function getRandomElement(arr: string[]) {
  if (!Array.isArray(arr) || arr.length === 0) {
    throw new Error('Нужно передать непустой массив!');
  }
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
}

function getStatus(status: string) {
  switch (status) {
    case 'excellent':
      return '🤟🤟🤟';
    case 'good':
      return '😉😉😉';
    case 'bad':
      return '🤨🤨🤨';
  }
}

@Scene('TRAINER_SCENE_ID')
export class TrainerProvider {
  constructor(
    private contextProvider: ContextProvider,
    private openRouterProvider: OpenRouterProvider,
    private logger: LoggerProvider,
  ) {}

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: Scenes.SceneContext) {
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

    const awaitingMessage = await ctx.reply(
      'Пару мгновений, готовлю краткую справку️ ⏱️',
    );

    const result = await this.openRouterProvider.sendMessage(
      context.promptRule,
    );

    const arrayText = result.choices[0].message.content
      .replace('```json', '')
      .replace('```', '');

    const preparedText = JSON.parse(arrayText)
      .reduce((acc, item) => {
        const { title, description } = item;

        acc += `*${title}*\n\n${description}\n\n`;

        return acc;
      }, '')
      .replaceAll('(', '\\(')
      .replaceAll(')', '\\)')
      .replaceAll('.', '\\.')
      .replaceAll('+', '\\+')
      .replaceAll('-', '\\-');

    await ctx.deleteMessage(awaitingMessage.message_id);

    await ctx.replyWithMarkdownV2(preparedText, {
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
    });
  }

  @On('text')
  async answerAnswer(
    @Ctx() ctx: Scenes.SceneContext,
    @Message('') message: TMessageType,
  ) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const contextName = ctx.session.contextName;

    const context = await this.contextProvider.getOneByAlias(contextName);

    if (!context) {
      throw new Error(`Context not found: ${contextName}`);
    }

    const result = await this.openRouterProvider.sendMessage(
      context.promptAnswer,
      [
        {
          type: 'text',
          text: message.text,
        },
      ],
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

    const result = await this.openRouterProvider.sendMessage(
      context.promptQuestion,
    );

    const clearedMessage = result.choices[0].message.content
      .replace('```json', '')
      .replace('```', '');

    try {
      const parsedMessage: { title: string; text: string } =
        JSON.parse(clearedMessage);

      await ctx.reply(`${parsedMessage.text.trim()}
    `);
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
      },);
    }
  }
}
