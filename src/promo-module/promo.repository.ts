import {
  FilterQuery,
  Model,
  ProjectionType,
  QueryOptions,
  UpdateQuery,
} from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Promo, PromoDocument } from './promo.model';

@Injectable()
export class PromoRepository {
  constructor(@InjectModel(Promo.name) private model: Model<Promo>) {}

  find(
    filter: FilterQuery<PromoDocument> = {},
    projection?: ProjectionType<PromoDocument>,
    options?: QueryOptions<PromoDocument>,
  ) {
    return this.model.find<PromoDocument>(filter, projection, options);
  }

  findOne(
    filter: FilterQuery<PromoDocument> = {},
    projection?: ProjectionType<PromoDocument>,
    options?: QueryOptions<PromoDocument>,
  ) {
    return this.model.findOne<PromoDocument>(filter, projection, options);
  }

  updateOne(
    filter: FilterQuery<PromoDocument> = {},
    update: UpdateQuery<PromoDocument>,
    options?: any, //@todo уточнить тип
  ) {
    return this.model.updateOne<PromoDocument>(filter, update, options);
  }

  findOneAndUpdate(
    filter?: FilterQuery<PromoDocument>,
    update?: UpdateQuery<PromoDocument>,
  ) {
    return this.model.findOneAndUpdate(filter, update, {
      new: true,
      upsert: true,
    });
  }
}
