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

@Scene('PAYMENT_SCENE_ID')
export class PaymentProvider {
  constructor(
  ) {}

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: Scenes.SceneContext) {
    try {
      await ctx.deleteMessage();
    } catch (e) {}

    await ctx.replyWithMarkdownV2('🎛️', {
      reply_markup: {
        keyboard: [[{ text: '📱️Меню' }]],
        resize_keyboard: true,
        one_time_keyboard: false,
      },
    });

    await ctx.reply('Страница оплаты');
  }
}
