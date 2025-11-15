import {
  FilterQuery,
  Model,
  ProjectionType,
  QueryOptions,
  UpdateQuery,
} from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import {
  ActivatedPromo,
  ActivatedPromoDocument,
} from './activated-promo.model';

@Injectable()
export class ActivatedPromoRepository {
  constructor(
    @InjectModel(ActivatedPromo.name) private model: Model<ActivatedPromo>,
  ) {}

  find(
    filter: FilterQuery<ActivatedPromoDocument> = {},
    projection?: ProjectionType<ActivatedPromoDocument>,
    options?: QueryOptions<ActivatedPromoDocument>,
  ) {
    return this.model.find<ActivatedPromoDocument>(filter, projection, options);
  }

  findOne(
    filter: FilterQuery<ActivatedPromoDocument> = {},
    projection?: ProjectionType<ActivatedPromoDocument>,
    options?: QueryOptions<ActivatedPromoDocument>,
  ) {
    return this.model.findOne<ActivatedPromoDocument>(
      filter,
      projection,
      options,
    );
  }

  updateOne(
    filter: FilterQuery<ActivatedPromoDocument> = {},
    update: UpdateQuery<ActivatedPromoDocument>,
    options?: any, //@todo уточнить тип
  ) {
    return this.model.updateOne<ActivatedPromoDocument>(
      filter,
      update,
      options,
    );
  }

  findOneAndUpdate(
    filter?: FilterQuery<ActivatedPromoDocument>,
    update?: UpdateQuery<ActivatedPromoDocument>,
  ) {
    return this.model.findOneAndUpdate(filter, update, {
      new: true,
      upsert: true,
    });
  }
}
