import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ActivatedPromoRepository } from './activated-promo.repository';
import { Promo, PromoSchema } from './promo.model';
import { ActivatedPromoProvider } from './activated-promo.provider';
import { ActivatedPromo, ActivatedPromoSchema } from './activated-promo.model';
import { PromoRepository } from './promo.repository';
import { PromoProvider } from './promo.provider';
import { SubscriptionModule } from '../subscription-module/subscription.module';

@Module({
  imports: [
    SubscriptionModule,
    MongooseModule.forFeature([
      { name: Promo.name, schema: PromoSchema },
      { name: ActivatedPromo.name, schema: ActivatedPromoSchema },
    ]),
  ],
  providers: [
    ActivatedPromoProvider,
    ActivatedPromoRepository,
    PromoRepository,
    PromoProvider,
  ],
  exports: [ActivatedPromoProvider, PromoProvider],
})
export class PromoModule {}
