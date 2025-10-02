import {
  FilterQuery,
  Model,
  ProjectionType,
  QueryOptions,
  UpdateQuery,
} from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Context, ContextDocument } from './context.model';

@Injectable()
export class ContextRepository {
  constructor(@InjectModel(Context.name) private model: Model<Context>) {}

  create(data: Record<string, any>) {
    return this.model.create(data);
  }

  findOneAndUpdate(
    filter?: FilterQuery<ContextDocument>,
    update?: UpdateQuery<ContextDocument>,
  ) {
    return this.model.findOneAndUpdate(filter, update, {
      new: true,
      upsert: true,
    });
  }

  findOne(
    filter?: FilterQuery<ContextDocument>,
    projection?: ProjectionType<ContextDocument>,
    options?: QueryOptions<ContextDocument>,
  ) {
    return this.model.findOne<ContextDocument>(filter, projection, options);
  }
}
