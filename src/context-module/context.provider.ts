import { Injectable } from '@nestjs/common';
import { ContextRepository } from './context.repository';

@Injectable()
export class ContextProvider {
  constructor(private contextRepo: ContextRepository) {}

  getAllActive(fields: string[] = []) {
    const f = fields.reduce((acc, item) => ({ ...acc, [item]: 1 }), {});

    return this.contextRepo.find({ isActive: true }, f).lean().exec();
  }

  getOneByAlias(alias: string) {
    return this.contextRepo.findOne({ alias, isActive: true }).lean().exec();
  }
}
