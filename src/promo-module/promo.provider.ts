import { Injectable } from '@nestjs/common';

import { PromoRepository } from './promo.repository';

@Injectable()
export class PromoProvider {
  constructor(private promoRepo: PromoRepository) {}

  createOrUpdate(filter: Record<string, any>, update: Record<string, any>) {
    return this.promoRepo.findOneAndUpdate(filter, update).lean().exec();
  }

  getPromoByCode(code: string) {
    const now = new Date();
    
    return this.promoRepo
      .findOne({
        code,
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: null },
          { expiresAt: { $gte: now } },
          { $expr: { $gte: [{ $toDate: '$expiresAt' }, now] } },
        ],
      })
      .lean()
      .exec();
  }
}
