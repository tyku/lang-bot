import { Injectable } from '@nestjs/common';
import { SubscriptionRepository } from './subscription.repository';

@Injectable()
export class SubscriptionProvider {
  constructor(private subscriptionRepo: SubscriptionRepository) {}

  createOrUpdate(filter: Record<string, any>, update: Record<string, any>) {
    return this.subscriptionRepo.findOneAndUpdate(filter, update).lean().exec();
  }

  async hasActiveSubscription(chatId: number) {
    const activeSubscriptions = await this.subscriptionRepo
      .findOne({ chatId, dateTo: { $gte: new Date() } })
      .lean()
      .exec();

    return Boolean(activeSubscriptions);
  }
}
