import {
  FilterQuery,
  Model,
  ProjectionType,
  QueryOptions,
} from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { NotificationSent, NotificationSentDocument } from './notification-sent.model';

@Injectable()
export class NotificationSentRepository {
  constructor(
    @InjectModel(NotificationSent.name)
    private model: Model<NotificationSent>,
  ) {}

  create(data: Partial<NotificationSent>) {
    return this.model.create(data);
  }

  findOne(
    filter?: FilterQuery<NotificationSentDocument>,
    projection?: ProjectionType<NotificationSentDocument>,
    options?: QueryOptions<NotificationSentDocument>,
  ) {
    return this.model.findOne<NotificationSentDocument>(
      filter,
      projection,
      options,
    );
  }

  exists(filter?: FilterQuery<NotificationSentDocument>) {
    return this.model.exists(filter || {});
  }
}

