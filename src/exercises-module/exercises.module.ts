import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Exercises, ExercisesSchema } from './exercises.model';
import { ExercisesProvider } from './exercises.provider';
import { ExercisesRepository } from './exercises.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Exercises.name, schema: ExercisesSchema },
    ]),
  ],
  providers: [ExercisesRepository, ExercisesProvider],
  exports: [ExercisesProvider],
})
export class ExercisesModule {}
