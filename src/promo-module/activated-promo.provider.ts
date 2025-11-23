import { Injectable } from '@nestjs/common';

import { ActivatedPromoRepository } from './activated-promo.repository';
import { PromoProvider } from './promo.provider';
import { SubscriptionProvider } from '../subscription-module/subscription.provider';
import { ESubscriptionType } from '../subscription-module/constants/types';
import { Promo } from './promo.model';
import { ActivatedPromo } from './activated-promo.model';

@Injectable()
export class ActivatedPromoProvider {
  constructor(
    private promoRepo: PromoProvider,
    private activatedPromoRepo: ActivatedPromoRepository,
    private subscriptionProvide: SubscriptionProvider,
  ) {}

  createOrUpdate(filter: Record<string, any>, update: Record<string, any>) {
    return this.activatedPromoRepo
      .findOneAndUpdate(filter, update)
      .lean()
      .exec();
  }

  async isApplied(filter: Record<string, any>) {
    const promo = await this.activatedPromoRepo.findOne(filter).lean().exec();

    return !!promo;
  }

  async tryActivate(chatId: number, code: string): Promise<Promo | null> {
    const promo = await this.promoRepo.getPromoByCode(code);

    if (!promo) {
      return null;
    }

    const isApplied = await this.isApplied({ chatId, code });

    if (isApplied) {
      return null;
    }

    if (promo.type !== 'subscription') {
      return null;
    }

    const hasActive = await this.subscriptionProvide.hasActiveSubscription(chatId);

    if (hasActive) {
      return null;
    }

    const now = new Date();
    const plusDays = new Date(now);

    plusDays.setDate(now.getDate() + promo.data.days);
    plusDays.setUTCHours(23, 59, 59, 999);

    const result = await this.subscriptionProvide.createOrUpdate(
      { chatId },
      {
        type: ESubscriptionType.GIFT,
        dateFrom: new Date(),
        dateTo: plusDays,
      },
    );

    await this.createOrUpdate({ chatId, code }, { appliedAt: new Date() });

    return promo;
  }
}
