import { Scene, SceneEnter, Ctx } from 'nestjs-telegraf';

import { Scenes } from 'telegraf';
import { ContextProvider } from '../../context-module/context.provider';
import { InlineKeyboardButton } from '@telegraf/types';

type TSession = { session: { source: string; __scenes: Record<string, any> } };
type TUpdate = { update: any };

@Scene('MENU_SCENE_ID')
export class MenuProvider {
  constructor(private contextProvider: ContextProvider) {}

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: Scenes.SceneContext & TUpdate & TSession) {
    // const chatId =
    //   ctx.update?.message?.chat?.id ||
    //   ctx.update?.callback_query?.message?.chat?.id;

    const activeContexts = await this.contextProvider.getAllActive([
      'name',
      'alias',
      'order',
      'isFree'
    ]);

    const sortedContext = activeContexts.sort(
      (contextA, contextB) => contextA.order - contextB.order,
    );

    const menuButtons = sortedContext.reduce((acc, item) => {
      const { name, alias, isFree } = item;

      const button = {
        text: isFree ? `🆓 ${name}` : name,
        callback_data: `trainer:${alias}`,
      };
      acc.push([button]);

      return acc;
    }, [] as InlineKeyboardButton[][]);

    await ctx.replyWithMarkdownV2(
      '📷 Выбери тему, начни выполнять упражнения, а я подскажу, где ошибки и объясню их\\! 💫\n',
      {
        reply_markup: {
          inline_keyboard: [
            ...menuButtons,
            [
              {
                text: '🈹 Промокод',
                callback_data: 'promo_code',
              },
              // { text: '🤝 Реферальная система', callback_data: 'referral' },
            ],
            // [
              // {
                // text: '📬 Поддержка',
                // url: 'https://t.me/RabbitHole_support',
              // },
              // { text: '🤝 Реферальная система', callback_data: 'referral' },
            // ],
          ],
        },
      },
    );
  }
}
