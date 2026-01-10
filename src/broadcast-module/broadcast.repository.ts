import {
  FilterQuery,
  Model,
  ProjectionType,
  QueryOptions,
  UpdateQuery,
} from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Broadcast, BroadcastDocument } from './broadcast.model';

@Injectable()
export class BroadcastRepository {
  constructor(
    @InjectModel(Broadcast.name)
    private model: Model<Broadcast>,
  ) {}

  create(data: Partial<Broadcast>) {
    return this.model.create(data);
  }

  findOneAndUpdate(
    filter?: FilterQuery<BroadcastDocument>,
    update?: UpdateQuery<BroadcastDocument>,
  ) {
    return this.model.findOneAndUpdate(filter, update, {
      new: true,
      upsert: true,
    });
  }

  findOne(
    filter?: FilterQuery<BroadcastDocument>,
    projection?: ProjectionType<BroadcastDocument>,
    options?: QueryOptions<BroadcastDocument>,
  ) {
    return this.model.findOne<BroadcastDocument>(
      filter,
      projection,
      options,
    );
  }

  find(
    filter?: FilterQuery<BroadcastDocument>,
    projection?: ProjectionType<BroadcastDocument>,
    options?: QueryOptions<BroadcastDocument>,
  ) {
    return this.model.find<BroadcastDocument>(
      filter || {},
      projection,
      options,
    );
  }

  updateOne(
    filter?: FilterQuery<BroadcastDocument>,
    update?: UpdateQuery<BroadcastDocument>,
  ) {
    return this.model.updateOne(filter || {}, update || {});
  }

  deleteOne(filter?: FilterQuery<BroadcastDocument>): Promise<any> {
    return this.model.deleteOne(filter || {});
  }
}

