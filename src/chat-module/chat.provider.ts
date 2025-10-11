import { Injectable } from '@nestjs/common';
import { ChatRepository } from './chat.repository';

@Injectable()
export class ChatProvider {
  constructor(private chatRepo: ChatRepository) {}

  addRecord(
    chatId: number,
    contextId: string,
    data: Partial<{ question: string; answer: string }>,
  ) {
    if (!Object.keys(data).length) {
      return false;
    }

    return this.chatRepo
      .addContentOrCreate(chatId, contextId, data)
      .lean()
      .exec();
  }

  async getRecords(chatId: number, contextId: string) {
    const records = await this.chatRepo
      .findOne({ chatId, contextId }, { content: 1 })
      .lean()
      .exec();

    if (records) {
      return records.content.map(({ question }) => question);
    }

    return [];
  }

  async getLastQuestion(chatId: number, contextId: string) {
    const record = await this.chatRepo
      .findOne({ chatId, contextId }, { content: { $slice: -1 } })
      .lean()
      .exec();

    if (!record) {
      return null;
    }

    return record.content.length > 0 ? record.content[0] : null;
  }
}
