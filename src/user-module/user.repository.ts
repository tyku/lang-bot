import {
  FilterQuery,
  Model,
  ProjectionType,
  QueryOptions,
  UpdateQuery,
} from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { User, UserDocument } from './user.model';

@Injectable()
export class UserRepository {
  constructor(@InjectModel(User.name) private model: Model<User>) {}

  create(data: Record<string, any>) {
    return this.model.create(data);
  }

  findOneAndUpdate(
    filter?: FilterQuery<UserDocument>,
    update?: UpdateQuery<UserDocument>,
  ) {
    return this.model.findOneAndUpdate(filter, update, {
      new: true,
      upsert: true,
    });
  }

  findOne(
    filter?: FilterQuery<UserDocument>,
    projection?: ProjectionType<UserDocument>,
    options?: QueryOptions<UserDocument>,
  ) {
    return this.model.findOne<UserDocument>(filter, projection, options);
  }
}
