import { Action, Ctx, Hears, On, Start, Update } from 'nestjs-telegraf';
import { Scenes } from 'telegraf';

import { LoggerProvider } from '../logger-module/logger.provider';
import { SubscriptionProvider } from '../subscription-module/subscription.provider';
import { ESubscriptionType } from '../subscription-module/constants/types';
import { EPaymentProvider, EPaymentStatus } from 'src/payments-module/constants/types';
import { getTariffById } from './constants/tariffs';
import { PaymentProvider } from 'src/payments-module/payment.provider';

@Update()
export class TelegramUpdate {
  constructor(
    private logger: LoggerProvider,
    private subscriptionProvider: SubscriptionProvider,
    private paymentProvider: PaymentProvider,
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

  @Hears('📱️ Меню')
  async menu(@Ctx() ctx: Scenes.SceneContext) {
    await ctx.reply('👌', {
      reply_markup: {
        remove_keyboard: true,
      },
    });
    await ctx.scene.leave();

    await ctx.scene.enter('MENU_SCENE_ID');
  }

  @On('pre_checkout_query')
  async onPreCheckoutQuery(@Ctx() ctx: Scenes.SceneContext) {
    try {
      if (!ctx.preCheckoutQuery) {
        return;
      }

      const chatId = ctx.from?.id || ctx.chat?.id;
      
      if (!chatId) {
        await ctx.answerPreCheckoutQuery(false, 'Ошибка получения данных пользователя');
        return;
      }

      let payloadData;
      try {
        payloadData = JSON.parse(ctx.preCheckoutQuery.invoice_payload);
      } catch (e) {
        this.logger.error(`${this.constructor.name} onPreCheckoutQuery: failed to parse payload: ${e}`);
        await ctx.answerPreCheckoutQuery(false, 'Ошибка обработки платежа');
        return;
      }

      const { tariffId, amount, chatId: payloadChatId } = payloadData;
      const tariff = getTariffById(tariffId);

      if (!tariff) {
        this.logger.error(`${this.constructor.name} onPreCheckoutQuery: tariff not found: ${tariffId}`);
        await ctx.answerPreCheckoutQuery(false, 'Тариф не найден');
        return;
      }

      const userId = payloadChatId || chatId;
      const externalPaymentId = ctx.preCheckoutQuery.id;

      // Создаем запись о платеже
      await this.paymentProvider.create({
        chatId: userId,
        provider: EPaymentProvider.TELEGRAM_STARS,
        amount: tariff.amount,
        price: tariff.price,
        tariffId: tariff.id,
        externalPaymentId: externalPaymentId,
        metadata: {
          currency: ctx.preCheckoutQuery.currency,
          totalAmount: ctx.preCheckoutQuery.total_amount,
          invoicePayload: ctx.preCheckoutQuery.invoice_payload,
        },
      });
      
      // Всегда подтверждаем запрос
      await ctx.answerPreCheckoutQuery(true);
    } catch (e) {
      this.logger.error(`${this.constructor.name} onPreCheckoutQuery: ${e}`);
      
      const chatId = ctx.from?.id || ctx.chat?.id;
      
      try {
        await ctx.answerPreCheckoutQuery(false, 'Произошла ошибка при обработке платежа');
      } catch (err) {
        this.logger.error(`${this.constructor.name} onPreCheckoutQuery answerPreCheckoutQuery: ${err}`);
      }
    }
  }

  @On('successful_payment')
  async onSuccessfulPayment(@Ctx() ctx: Scenes.SceneContext) {
    try {
      const payment = (ctx.message as any)?.successful_payment;
      if (!payment) {
        return;
      }

      let payloadData;
      try {
        payloadData = JSON.parse(payment.invoice_payload);
      } catch (e) {
        this.logger.error(`${this.constructor.name} onSuccessfulPayment: failed to parse payload: ${e}`);
        await ctx.reply('Произошла ошибка при обработке платежа. Обратитесь в поддержку.');
        return;
      }

      const { tariffId, amount, chatId } = payloadData;
      const tariff = getTariffById(tariffId);

      if (!tariff) {
        this.logger.error(`${this.constructor.name} onSuccessfulPayment: tariff not found: ${tariffId}`);
        await ctx.reply('Тариф не найден. Обратитесь в поддержку.');
        return;
      }

      const userId = chatId || ctx.from?.id || ctx.chat?.id;
      if (!userId) {
        this.logger.error(`${this.constructor.name} onSuccessfulPayment: userId is undefined`);
        await ctx.reply('Произошла ошибка при обработке платежа. Обратитесь в поддержку.');
        return;
      }

      // Обновляем статус платежа на SUCCESS
      const telegramPaymentId = payment.telegram_payment_charge_id || payment.provider_payment_charge_id;
      
      // Пытаемся найти платеж по externalPaymentId (из pre_checkout_query.id)
      // или по telegram_payment_charge_id
      let updatedPayment: any = null;
      
      if (telegramPaymentId) {
        updatedPayment = await this.paymentProvider.updateStatusByExternalId(
          telegramPaymentId,
          EPaymentProvider.TELEGRAM_STARS,
          {
            status: EPaymentStatus.SUCCESS,
            metadata: {
              telegramPaymentChargeId: telegramPaymentId,
              providerPaymentChargeId: payment.provider_payment_charge_id,
              currency: payment.currency,
              totalAmount: payment.total_amount,
            },
          },
        );
      }

      // Если не нашли по externalPaymentId, ищем по chatId + tariffId + статус PENDING
      if (!updatedPayment) {
        const pendingPayments = await this.paymentProvider.findByChatId(userId, 10);
        const pendingPayment = pendingPayments.find(
          (p) => p.tariffId === tariff.id && p.status === EPaymentStatus.PENDING && p.provider === EPaymentProvider.TELEGRAM_STARS,
        );
        
        if (pendingPayment) {
          updatedPayment = await this.paymentProvider.updateStatus(
            pendingPayment._id.toString(),
            {
              status: EPaymentStatus.SUCCESS,
              externalPaymentId: telegramPaymentId,
              metadata: {
                telegramPaymentChargeId: telegramPaymentId,
                providerPaymentChargeId: payment.provider_payment_charge_id,
                currency: payment.currency,
                totalAmount: payment.total_amount,
              },
            },
          );
        }
      }

      // Если все еще не нашли, создаем новый платеж (на случай, если pre_checkout_query не сработал)
      if (!updatedPayment) {
        this.logger.warn(
          `${this.constructor.name} onSuccessfulPayment: payment record not found, creating new one`,
        );
        await this.paymentProvider.create({
          chatId: userId,
          provider: EPaymentProvider.TELEGRAM_STARS,
          amount: tariff.amount,
          price: tariff.price,
          tariffId: tariff.id,
          externalPaymentId: telegramPaymentId,
          metadata: {
            telegramPaymentChargeId: telegramPaymentId,
            providerPaymentChargeId: payment.provider_payment_charge_id,
            currency: payment.currency,
            totalAmount: payment.total_amount,
          },
        });
      }

      // Пополняем баланс
      const now = new Date();
      const plusDays = new Date(now);

      plusDays.setDate(now.getDate() + tariff.amount);
      plusDays.setUTCHours(23, 59, 59, 999);

      const result = await this.subscriptionProvider.createOrUpdate(
        { chatId },
        {
          type: ESubscriptionType.PAID,
          dateFrom: new Date(),
          dateTo: plusDays,
        },
      );

      // const newBalance = await this.subscriptionProvider.getBalance(userId);

      await ctx.reply(
        `✅ Платеж успешно обработан!\n\n` +
        `💰 Оформлена подписка до: 🎨 ${plusDays.toLocaleDateString('RU-ru')}`);

        await ctx.scene.leave();
        await ctx.scene.enter('MENU_SCENE_ID')
    } catch (e) {
      this.logger.error(`${this.constructor.name} onSuccessfulPayment: ${e}`);
      
      await ctx.reply('Произошла ошибка при обработке платежа. Обратитесь в поддержку.');
    }
  }
}
