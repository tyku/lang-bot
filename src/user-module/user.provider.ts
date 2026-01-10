import { Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { User } from './user.model';

@Injectable()
export class UserProvider {
  constructor(private userRepo: UserRepository) {}

  createUserIfNotExists(chatId: number, data: Record<any, any>) {
    return this.userRepo.findOneAndUpdate({ chatId }, data);
  }

  async findByChatId(chatId: number): Promise<User | null> {
    return this.userRepo.findOne({ chatId });
  }

  async updateTimezone(chatId: number, timezone: string): Promise<User | null> {
    return this.userRepo.findOneAndUpdate({ chatId }, { timezone });
  }
}
