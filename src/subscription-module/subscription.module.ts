import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Subscription, SubscriptionsSchema } from './subscription.model';
import { SubscriptionProvider } from './subscription.provider';
import { SubscriptionRepository } from './subscription.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionsSchema },
    ]),
  ],
  providers: [SubscriptionProvider, SubscriptionRepository],
  exports: [SubscriptionProvider],
})
export class SubscriptionModule {}
