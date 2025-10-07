import { FilterQuery, Model, ProjectionType, QueryOptions } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Context, ContextDocument } from './context.model';

@Injectable()
export class ContextRepository {
  constructor(@InjectModel(Context.name) private model: Model<Context>) {}

  find(
    filter: FilterQuery<ContextDocument> = {},
    projection?: ProjectionType<ContextDocument>,
    options?: QueryOptions<ContextDocument>,
  ) {
    return this.model.find<ContextDocument>(filter, projection, options);
  }

  findOne(
    filter: FilterQuery<ContextDocument> = {},
    projection?: ProjectionType<ContextDocument>,
    options?: QueryOptions<ContextDocument>,
  ) {
    return this.model.findOne<ContextDocument>(filter, projection, options);
  }
}
