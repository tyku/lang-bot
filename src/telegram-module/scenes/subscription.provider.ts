import { Action, Ctx, Scene, SceneEnter } from 'nestjs-telegraf';
import { Scenes } from 'telegraf';

@Scene('SUBSCRIPTION_SCENE_ID')
export class SubscriptionProvider {
  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: Scenes.SceneContext) {
    await ctx.replyWithMarkdownV2("Нажми кнопку", {
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'Ну давай, жми', callback_data: 'push_button' },
          ],
        ],
      },
    });
  }

  @Action('push_button')
  async onPushButton(@Ctx() ctx: Scenes.SceneContext) {
    await ctx.replyWithMarkdownV2("Ты нажал кнопку", {
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'Ну давай, жми', callback_data: 'push_button' },
          ],
        ],
      },
    });
  }
}
