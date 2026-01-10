import { Injectable } from '@nestjs/common';
import { BroadcastRepository } from './broadcast.repository';
import { Broadcast } from './broadcast.model';

@Injectable()
export class BroadcastProvider {
  constructor(private broadcastRepository: BroadcastRepository) {}

  createOrUpdate(name: string, data: Partial<Broadcast>) {
    return this.broadcastRepository.findOneAndUpdate({ name }, data);
  }

  findByName(name: string) {
    return this.broadcastRepository.findOne({ name });
  }

  findAll() {
    return this.broadcastRepository.find();
  }

  findAllActive() {
    return this.broadcastRepository.find({ isActive: true });
  }

  updateStatus(name: string, isActive: boolean) {
    return this.broadcastRepository.updateOne({ name }, { isActive });
  }

  delete(name: string): Promise<any> {
    return this.broadcastRepository.deleteOne({ name });
  }
}

