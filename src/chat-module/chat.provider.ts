import { Injectable } from '@nestjs/common';
import { ChatRepository } from './chat.repository';

@Injectable()
export class ChatProvider {
  constructor(private contextRepo: ChatRepository) {}

  addRecord(
    chatId: number,
    contextId: string,
    data: Partial<{ question: string; answer: string }>,
  ) {
    if (!Object.keys(data).length) {
      return false;
    }

    return this.contextRepo
      .addContentOrCreate(chatId, contextId, data)
      .lean()
      .exec();
  }

  async getRecords(chatId: number, contextId: string) {
    const records = await this.contextRepo
      .findOne({ chatId, contextId }, { content: 1 })
      .lean()
      .exec();

    if (records) {
      return records.content.map(({ answer }) => answer);
    }

    return [];
  }
}
