import { Action, Ctx, Message, On, Scene, SceneEnter, SceneLeave } from 'nestjs-telegraf';
import { Scenes } from 'telegraf';
import { SupportProvider } from '../../support-module/support.provider';
import { escapeText } from '../libs/text-format';
import type { TMessageType } from '../types/message';

@Scene('SUPPORT_SCENE_ID')
export class SupportSceneProvider {
  constructor(private supportProvider: SupportProvider) {}

  private getChatId(ctx: Scenes.SceneContext): number | null {
    const chatId: number =
      (ctx.update as any)?.message?.chat?.id ||
      (ctx.update as any)?.callback_query?.message?.chat?.id ||
      (ctx as any).from?.id ||
      (ctx as any).chat?.id;

    return chatId || null;
  }

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: Scenes.SceneContext) {
    const chatId = this.getChatId(ctx);
    if (!chatId) {
      await ctx.reply('Ошибка: не удалось определить chatId');
      return;
    }

    const ticket = await this.supportProvider.getTicket(chatId);

    if (!ticket) {
      await ctx.replyWithMarkdownV2(
        escapeText(
          'Вы в режиме поддержки.\n' +
            'Опишите вашу проблему.\n' +
            'Ответ может занять до 24 часов.',
        ),
      );
      return;
    }

    const summary = await this.supportProvider.getTicketSummary(chatId);
    if (!summary) {
      return;
    }

    const statusText = summary.status === 'open' ? 'Открыт' : 'Ответ дан';
    const supportResponseText = summary.lastSupportResponse
      ? escapeText(summary.lastSupportResponse)
      : 'Пока нет ответа';

    const additionsText =
      summary.allUserMessages.length > 1
        ? '\n\n' +
          escapeText('Дополнения:\n') +
          summary.allUserMessages
            .slice(1)
            .map((msg, idx) => `${idx + 1}. ${escapeText(msg)}`)
            .join('\n')
        : '';

    const summaryText =
      `*Номер тикета: ${summary.ticketNumber}*\n\n` +
      escapeText('Ваше обращение:\n') +
      escapeText(`_${summary.firstMessage}_`) +
      additionsText +
      '\n\n' +
      escapeText(`Статус: _${statusText}_`) +
      '\n\n' +
      escapeText('Ответ поддержки:\n') +
      escapeText(`_${supportResponseText}_`);

    await ctx.replyWithMarkdownV2(summaryText, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '⬅ Вернуться в меню',
              callback_data: 'support_back_to_menu',
            },
          ],
        ],
      },
    });
  }

  @SceneLeave()
  async onSceneLeave(@Ctx() ctx: Scenes.SceneContext) {
    const chatId = this.getChatId(ctx);
    if (chatId) {
      this.supportProvider.clearPendingMessage(chatId);
    }
    ctx.scene.state = {};
  }

  @On('text')
  async onText(
    @Ctx() ctx: Scenes.SceneContext,
    @Message('') message: TMessageType,
  ) {
    const chatId = this.getChatId(ctx);
    if (!chatId) {
      return;
    }

    if (message.text === '📱️ Меню') {
      await ctx.scene.leave();
      await ctx.scene.enter('MENU_SCENE_ID');
      return;
    }

    const ticket = await this.supportProvider.getTicket(chatId);

    if (!ticket) {
      const newTicket = await this.supportProvider.createTicket(chatId, message.text);
      const ticketNumber = newTicket.ticketNumber || 0;

      await ctx.replyWithMarkdownV2(
        `*Номер тикета: ${ticketNumber}*\n\n` +
          escapeText(
            'Сообщение зарегистрировано.\n' +
              'Обработка может занять до 24 часов.',
          ),
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '⬅ Вернуться в меню',
                  callback_data: 'support_back_to_menu',
                },
              ],
            ],
          },
        },
      );
      return;
    }

    const pendingMessage = this.supportProvider.getPendingMessage(chatId);
    if (pendingMessage) {
      return;
    }

    this.supportProvider.setPendingMessage(chatId, message.text);

    await ctx.replyWithMarkdownV2(
      escapeText('Вы хотите добавить это сообщение к существующему обращению?'),
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '✅ Да',
                callback_data: 'support_add_message_yes',
              },
              {
                text: '❌ Нет',
                callback_data: 'support_add_message_no',
              },
            ],
          ],
        },
      },
    );
  }

  @Action('support_add_message_yes')
  async onAddMessageYes(@Ctx() ctx: Scenes.SceneContext & { update: { callback_query: any } }) {
    const chatId = this.getChatId(ctx);
    if (!chatId) {
      await ctx.answerCbQuery('Ошибка');
      return;
    }

    const pendingMessage = this.supportProvider.getPendingMessage(chatId);
    if (!pendingMessage) {
      await ctx.answerCbQuery('Сообщение не найдено');
      return;
    }

    await this.supportProvider.addMessage(chatId, pendingMessage);
    this.supportProvider.clearPendingMessage(chatId);

    await ctx.answerCbQuery();

    try {
      await ctx.deleteMessage();
    } catch (e) {}

    await ctx.replyWithMarkdownV2(
      escapeText(
        'Сообщение добавлено к обращению.\n' +
          'Обработка может занять до 24 часов.',
      ),
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '⬅ Вернуться в меню',
                callback_data: 'support_back_to_menu',
              },
            ],
          ],
        },
      },
    );
  }

  @Action('support_add_message_no')
  async onAddMessageNo(@Ctx() ctx: Scenes.SceneContext & { update: { callback_query: any } }) {
    const chatId = this.getChatId(ctx);
    if (!chatId) {
      await ctx.answerCbQuery('Ошибка');
      return;
    }

    const pendingMessage = this.supportProvider.getPendingMessage(chatId);
    if (!pendingMessage) {
      await ctx.answerCbQuery('Сообщение не найдено');
      return;
    }

    const newTicket = await this.supportProvider.createTicket(chatId, pendingMessage);
    this.supportProvider.clearPendingMessage(chatId);

    await ctx.answerCbQuery();

    try {
      await ctx.deleteMessage();
    } catch (e) {}

    const ticketNumber = newTicket.ticketNumber || 0;

    await ctx.replyWithMarkdownV2(
      `*Номер тикета: ${ticketNumber}*\n\n` +
        escapeText(
          'Создан новый тикет.\n' +
            'Сообщение зарегистрировано.\n' +
            'Обработка может занять до 24 часов.',
        ),
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '⬅ Вернуться в меню',
                callback_data: 'support_back_to_menu',
              },
            ],
          ],
        },
      },
    );
  }

  @Action('support_back_to_menu')
  async onBackToMenu(@Ctx() ctx: Scenes.SceneContext) {
    await ctx.answerCbQuery();
    await ctx.scene.leave();
    await ctx.scene.enter('MENU_SCENE_ID');
  }
}

