import { Ctx, Message, Next, On, Scene, SceneEnter } from 'nestjs-telegraf';
import { Scenes } from 'telegraf';
import type { TMessageType } from '../types/message';
import { ConfigService } from '@nestjs/config';
import { SubscriptionProvider } from '../../subscription-module/subscription.provider';
import { ActivatedPromoProvider } from '../../promo-module/activated-promo.provider';
import { PromoProvider } from '../../promo-module/promo.provider';
import { LoggerProvider } from '../../logger-module/logger.provider';

function getFormattedDate(data: Date) {
  const day = String(data.getDate()).padStart(2, '0');
  const month = String(data.getMonth() + 1).padStart(2, '0');
  const year = data.getFullYear(); // "2025"

  return `${day}.${month}.${year}`;
}

@Scene('PROMOCODE_SCENE_ID')
export class PromocodeProvider {
  constructor(
    private configProvider: ConfigService,
    private logger: LoggerProvider,
    private subscriptionProvide: SubscriptionProvider,
    private promoProvider: PromoProvider,
    private activatedPromoProvider: ActivatedPromoProvider,
  ) {}

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: Scenes.SceneContext) {
    try {
      await ctx.deleteMessage();
    } catch (e) {}

    await ctx.replyWithMarkdownV2('🎛️', {
      reply_markup: {
        keyboard: [[{ text: '📱️ Меню' }]],
        resize_keyboard: true,
        one_time_keyboard: false,
      },
    });

    await ctx.replyWithMarkdownV2('Введите промокод 🤓');
  }

  @On('text')
  async onText(
    @Ctx() ctx: Scenes.SceneContext,
    @Next() next: any,
    @Message('') message: TMessageType,
  ) {
    if (message.text === '📱️ Меню') {
      await next();

      return;
    }

    const chatId: number =
      (ctx.update as any)?.message?.chat?.id ||
      (ctx.update as any)?.callback_query?.message?.chat?.id;

    const appliedPromo = await this.activatedPromoProvider.tryActivate(
      chatId,
      message.text,
    );

    if (!appliedPromo) {
      this.logger.error(
        `${this.constructor.name} apply promo: error occurred, empty applied promo `,
      );

      await ctx.reply('Промокод не существует или уже применен ❌ ');

      return;
    }

    const now = new Date();
    const plusDays = new Date(now);

    plusDays.setDate(now.getDate() + appliedPromo.data.days);

    await ctx.replyWithMarkdownV2(
      `Промокод применен. Подписка продлена до: *${getFormattedDate(plusDays)}* ✅`.replaceAll(
        '.',
        '\\.',
      ),
    );

    return;
  }
}
