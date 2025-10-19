import {
  FilterQuery,
  Model,
  ProjectionType,
  QueryOptions,
  UpdateQuery,
} from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Exercises, ExercisesDocument } from './exercises.model';

@Injectable()
export class ExercisesRepository {
  constructor(@InjectModel(Exercises.name) private model: Model<Exercises>) {}

  find(
    filter: FilterQuery<ExercisesDocument> = {},
    projection?: ProjectionType<ExercisesDocument>,
    options?: QueryOptions<ExercisesDocument>,
  ) {
    return this.model.find<ExercisesDocument>(filter, projection, options);
  }

  findOne(
    filter: FilterQuery<ExercisesDocument> = {},
    projection?: ProjectionType<ExercisesDocument>,
    options?: QueryOptions<ExercisesDocument>,
  ) {
    return this.model.findOne<ExercisesDocument>(filter, projection, options);
  }

  updateOne(
    filter: FilterQuery<ExercisesDocument> = {},
    update: UpdateQuery<ExercisesDocument>,
    options?: any, //@todo уточнить тип
  ) {
    return this.model.updateOne<ExercisesDocument>(filter, update, options);
  }
}
