import { Scenes } from 'telegraf';
import { InlineKeyboardButton } from '@telegraf/types';
import { Ctx, Message, Scene, SceneEnter } from 'nestjs-telegraf';

import { UserProvider } from '../../user-module/user.provider';
import { ContextProvider } from '../../context-module/context.provider';

import type { TMessageType } from '../types/message';

@Scene('NEWUSER_SCENE_ID')
export class NewUserProvider {
  constructor(
    private userProvider: UserProvider,
    private contextProvider: ContextProvider,
  ) {}

  @SceneEnter()
  async onSceneEnter(
    @Ctx() ctx: Scenes.SceneContext,
    @Message('chat') chat: TMessageType['chat'],
  ) {
    const { id: chatId, first_name: firstName, username } = chat;

    await this.userProvider.createUserIfNotExists(chatId, {
      firstName,
      username,
    });

    const user = firstName || username;

    const activeContexts = await this.contextProvider.getAllActive([
      'name',
      'alias',
      'order',
    ]);

    const sortedContext = activeContexts.sort(
      (contextA, contextB) => contextA.order - contextB.order,
    );

    const menuButtons = sortedContext.reduce((acc, item) => {
      const { name, alias } = item;

      const button = {
        text: name,
        callback_data: `trainer:${alias}`,
      };
      acc.push([button]);

      return acc;
    }, [] as InlineKeyboardButton[][]);

    await ctx.replyWithMarkdownV2(
      `😏 Привет${user ? ', ' + user : ''}\\! Я \\- продвинутая нейронная сеть\\.\n` +
        '\n' +
        '🚀 Помогу тебе отработать различные темы английского языка\\. ✨\n' +
        '\n' +
        '📣 У меня в запасе, очень много примеров и безграничное терпение \n' +
        '\n' +
        '📷 Выбери тему, начни выполнять упражнения, а я подскажу, где ошибки и объясню их\\! 💫\n',
      {
        reply_markup: {
          inline_keyboard: [
            ...menuButtons,
            [
              {
                text: '📬 Поддержка',
                url: 'https://t.me/RabbitHole_support',
              },
              // { text: '🤝 Реферальная система', callback_data: 'referral' },
            ],
          ],
        },
      },
    );

    await ctx.scene.leave();
  }
}
