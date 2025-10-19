import { Injectable } from '@nestjs/common';
import { ExercisesRepository } from './exercises.repository';

@Injectable()
export class ExercisesProvider {
  constructor(private exerciseRepo: ExercisesRepository) {}

  getAllActive(fields: string[] = []) {
    const f = fields.reduce((acc, item) => ({ ...acc, [item]: 1 }), {});

    return this.exerciseRepo.find({ isActive: true }, f).lean().exec();
  }

  getByCodes(codes: string[] = []) {
    return this.exerciseRepo
      .find({ isActive: true, alias: { $in: codes } })
      .lean()
      .exec();
  }

  getOneByAlias(alias: string) {
    return this.exerciseRepo.findOne({ alias, isActive: true }).lean().exec();
  }

  updateOne(filter: Record<string, any>, update: Record<string, any>) {
    return this.exerciseRepo.updateOne(filter, update).lean().exec();
  }
}
