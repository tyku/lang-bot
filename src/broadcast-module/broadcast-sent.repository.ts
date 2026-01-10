import {
  FilterQuery,
  Model,
  ProjectionType,
  QueryOptions,
} from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { BroadcastSent, BroadcastSentDocument } from './broadcast-sent.model';

@Injectable()
export class BroadcastSentRepository {
  constructor(
    @InjectModel(BroadcastSent.name)
    private model: Model<BroadcastSent>,
  ) {}

  create(data: Partial<BroadcastSent>) {
    return this.model.create(data);
  }

  findOne(
    filter?: FilterQuery<BroadcastSentDocument>,
    projection?: ProjectionType<BroadcastSentDocument>,
    options?: QueryOptions<BroadcastSentDocument>,
  ) {
    return this.model.findOne<BroadcastSentDocument>(
      filter,
      projection,
      options,
    );
  }

  exists(filter?: FilterQuery<BroadcastSentDocument>) {
    return this.model.exists(filter || {});
  }

  find(
    filter?: FilterQuery<BroadcastSentDocument>,
    projection?: ProjectionType<BroadcastSentDocument>,
    options?: QueryOptions<BroadcastSentDocument>,
  ) {
    return this.model.find<BroadcastSentDocument>(
      filter || {},
      projection,
      options,
    );
  }

  count(filter?: FilterQuery<BroadcastSentDocument>) {
    return this.model.countDocuments(filter || {});
  }
}

