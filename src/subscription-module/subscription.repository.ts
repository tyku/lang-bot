import {
  FilterQuery,
  Model,
  ProjectionType,
  QueryOptions,
  UpdateQuery,
} from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Subscription, SubscriptionDocument } from './subscription.model';

@Injectable()
export class SubscriptionRepository {
  constructor(
    @InjectModel(Subscription.name) private model: Model<Subscription>,
  ) {}

  find(
    filter: FilterQuery<SubscriptionDocument> = {},
    projection?: ProjectionType<SubscriptionDocument>,
    options?: QueryOptions<SubscriptionDocument>,
  ) {
    return this.model.find<SubscriptionDocument>(filter, projection, options);
  }

  findOne(
    filter: FilterQuery<SubscriptionDocument> = {},
    projection?: ProjectionType<SubscriptionDocument>,
    options?: QueryOptions<SubscriptionDocument>,
  ) {
    return this.model.findOne<SubscriptionDocument>(
      filter,
      projection,
      options,
    );
  }

  updateOne(
    filter: FilterQuery<SubscriptionDocument> = {},
    update: UpdateQuery<SubscriptionDocument>,
    options?: any, //@todo уточнить тип
  ) {
    return this.model.updateOne<SubscriptionDocument>(filter, update, options);
  }

  findOneAndUpdate(
    filter?: FilterQuery<SubscriptionDocument>,
    update?: UpdateQuery<SubscriptionDocument>,
  ) {
    return this.model.findOneAndUpdate(filter, update, {
      new: true,
      upsert: true,
    });
  }
}
