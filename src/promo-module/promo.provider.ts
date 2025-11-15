import { Injectable } from '@nestjs/common';

import { PromoRepository } from './promo.repository';

@Injectable()
export class PromoProvider {
  constructor(private promoRepo: PromoRepository) {}

  createOrUpdate(filter: Record<string, any>, update: Record<string, any>) {
    return this.promoRepo.findOneAndUpdate(filter, update).lean().exec();
  }

  getPromoByCode(code: string) {
    return this.promoRepo
      .findOne({ code, expiresAt: { $gte: new Date() } })
      .lean()
      .exec();
  }
}
