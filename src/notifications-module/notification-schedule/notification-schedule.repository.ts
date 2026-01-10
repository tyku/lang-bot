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
  NotificationSchedule,
  NotificationScheduleDocument,
  DayOfWeek,
} from './notification-schedule.model';

@Injectable()
export class NotificationScheduleRepository {
  constructor(
    @InjectModel(NotificationSchedule.name)
    private model: Model<NotificationSchedule>,
  ) {}

  create(data: Partial<NotificationSchedule>) {
    return this.model.create(data);
  }

  findOneAndUpdate(
    filter?: FilterQuery<NotificationScheduleDocument>,
    update?: UpdateQuery<NotificationScheduleDocument>,
  ) {
    return this.model.findOneAndUpdate(filter, update, {
      new: true,
      upsert: true,
    });
  }

  findOne(
    filter?: FilterQuery<NotificationScheduleDocument>,
    projection?: ProjectionType<NotificationScheduleDocument>,
    options?: QueryOptions<NotificationScheduleDocument>,
  ) {
    return this.model.findOne<NotificationScheduleDocument>(
      filter,
      projection,
      options,
    );
  }

  find(
    filter?: FilterQuery<NotificationScheduleDocument>,
    projection?: ProjectionType<NotificationScheduleDocument>,
    options?: QueryOptions<NotificationScheduleDocument>,
  ) {
    return this.model.find<NotificationScheduleDocument>(
      filter || {},
      projection,
      options,
    );
  }

  updateOne(
    filter?: FilterQuery<NotificationScheduleDocument>,
    update?: UpdateQuery<NotificationScheduleDocument>,
  ) {
    return this.model.updateOne(filter || {}, update || {});
  }

  deleteOne(filter?: FilterQuery<NotificationScheduleDocument>): Promise<any> {
    return this.model.deleteOne(filter || {});
  }

  findActiveByDayOfWeek(dayOfWeek: DayOfWeek) {
    return this.model.find<NotificationScheduleDocument>({
      isActive: true,
      daysOfWeek: dayOfWeek, // MongoDB автоматически найдет в массиве
    });
  }
}

