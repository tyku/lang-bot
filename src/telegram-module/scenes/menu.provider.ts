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
    ]);

    const menuButtons = activeContexts.reduce((acc, item) => {
      const { name, alias } = item;

      const button = {
        text: name,
        callback_data: `load_${alias}`,
      };

      acc.push(button);

      return acc;
    }, [] as InlineKeyboardButton[]);

    await ctx.replyWithMarkdownV2(
      '😏 Привет\\! Я - продвинутая нейронная сеть\\.\n' +
        '\n' +
        '🚀 Помогу тебе отработать различные темы английского языка\\. ✨\n' +
        '\n' +
        '📣 У меня в запасе, очень много примеров и безграничное терпение \n' +
        '\n' +
        '📷 Выбери тему, начни выполнять упражнения, а я подскажу, где ошибки и объясню их\\! 💫\n',
      {
        reply_markup: {
          inline_keyboard: [
            menuButtons,
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
  }
}
