import { Command, Ctx, Start, Update } from 'nestjs-telegraf';
import { Context, Scenes } from 'telegraf';

@Update()
export class TelegramUpdate {
  @Start()
  async onStart(
    @Ctx()
    ctx: Context,
  ): Promise<void> {
// @ts-ignore
    console.log('===================', ctx.scene.enter)
    // await ctx.scene.leave();


    // await ctx.scene.enter('SUBSCRIPTION_SCENE_ID');

    await ctx.reply('asdasd');
  }


  @Command('scene')
  async onSceneCommand(@Ctx() ctx: Context): Promise<void> {
    // @ts-ignore
    console.log('-----------', ctx.scene)
    // @ts-ignore
    await ctx.scene.enter('');
  }
  // @Action('generate_again')
  // async onGenerate(@Ctx() ctx: Scenes.SceneContext) {
  //   delete ctx.session.source;
  //
  //   try {
  //     await ctx.deleteMessage();
  //   } catch (e) {}
  //
  //   await ctx.scene.enter('GENERATE_SCENE_ID');
  // }
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
  // @Hears('🎛️ Меню')
  // async menuConstant(@Ctx() ctx: WizardContext) {
  //   await ctx.scene.enter('MENU_SCENE_ID');
  // }
  //
  // @On('text')
  // async defaultAnswer(@Ctx() ctx: Context) {
  //   await ctx.reply('Такие команды я выполнять не умею 😀');
  // }
}
