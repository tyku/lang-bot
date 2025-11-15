import { Action, Ctx, Hears, Start, Update } from 'nestjs-telegraf';
import { Scenes } from 'telegraf';

import { LoggerProvider } from '../logger-module/logger.provider';
import { SubscriptionProvider } from '../subscription-module/subscription.provider';
import { ESubscriptionType } from '../subscription-module/constants/types';
import { getScene } from './libs/scenes';

@Update()
export class TelegramUpdate {
  constructor(
    private logger: LoggerProvider,
    private subscriptionProvider: SubscriptionProvider,
  ) {}

  @Start()
  async onStart(
    @Ctx()
    ctx: Scenes.SceneContext & { startPayload: Record<string, any> },
  ): Promise<void> {
    await ctx.scene.leave();

    if (ctx.session) {
      for (const key of Object.keys(ctx.session)) {
        delete ctx.session[key];
      }
    }

    if (ctx.session?.__scenes) {
      delete ctx.session.__scenes;
    }

    await ctx.scene.enter('NEWUSER_SCENE_ID');
  }

  @Action('promo_code')
  async onPromocode(@Ctx() ctx: Scenes.SceneContext) {
    try {
      await ctx.scene.leave();
    } catch (e) {}

    await ctx.scene.enter('PROMOCODE_SCENE_ID');
  }

  @Action(/^trainer:.+$/)
  async onTrainer(
    @Ctx() ctx: Scenes.SceneContext & { update: { callback_query: any } },
  ) {
    try {
      await ctx.deleteMessage();
    } catch (e) {
      this.logger.error(`${this.constructor.name} onTrainer error:`, e);
    }

    const action = ctx.update.callback_query?.data;
    const value = action.split(':')[1];

    await ctx.scene.enter('TRAINER_SCENE_ID', { contextName: value });
  }

  //
  // @Action('withdraw')
  // async onWithdraw(@Ctx() ctx: SceneContext) {
  //   delete ctx.session.source;
  //
  //   try {
  //     await ctx.deleteMessage();
  //   } catch (e) {}
  //
  //   await ctx.scene.enter('WITHDRAW_SCENE_ID');
  // }
  //
  // @Action(/^regenerate_v2:.+$/)
  // async onRegenerateV2(@Ctx() ctx: SceneContext) {
  //   delete ctx.session.source;
  //   const action = ctx.update.callback_query?.data;
  //
  //   const requestId = action.split(':')[1];
  //
  //   try {
  //     await ctx.deleteMessage();
  //   } catch (e) {}
  //
  //   await ctx.scene.enter('REGENERATE_SCENE_ID', { requestId });
  // }
  //
  // @Action('menu')
  // async onMenu(@Ctx() ctx: SceneContext & TSession) {
  //   try {
  //     await ctx.deleteMessage();
  //   } catch (e) {}
  //
  //   await ctx.scene.enter('MENU_SCENE_ID');
  // }
  //
  // @Action(['back_payment'])
  // async back(
  //   @Ctx() ctx: SceneContext,
  // ): Promise<void> {
  //   try {
  //     await ctx.deleteMessage();
  //   } catch (e) {}
  //
  //   await ctx.scene.enter('PAYMENT_WIZARD_ID');
  // }
  //
  // @Action(['referral'])
  // async referral(
  //   @Ctx() ctx: SceneContext,
  // ): Promise<void> {
  //   try {
  //     await ctx.deleteMessage();
  //   } catch (e) {}
  //
  //   await ctx.scene.enter('REFERRAL_SCENE_ID');
  // }
  //
  // @Action('payment_again')
  // async onPaymentAgain(@Ctx() ctx: SceneContext) {
  //   try {
  //     await ctx.deleteMessage();
  //   } catch (e) {}
  //
  //   await ctx.scene.enter('PAYMENT_WIZARD_ID');
  // }
  //
  // @Action('dice_again')
  // async diceMessage(@Ctx() ctx: SceneContext) {
  //   await ctx.scene.enter('DICE_SCENE_ID');
  // }
  //
  // @Action('darts_again')
  // async dartsMessage(@Ctx() ctx: SceneContext) {
  //   await ctx.scene.enter('DARTS_SCENE_ID');
  // }
  //

  @Hears('📱️Меню')
  async menu(@Ctx() ctx: Scenes.SceneContext) {
    await ctx.reply('👌', {
      reply_markup: {
        remove_keyboard: true,
      },
    });
    await ctx.scene.leave();

    await ctx.scene.enter('MENU_SCENE_ID');
  }
}
