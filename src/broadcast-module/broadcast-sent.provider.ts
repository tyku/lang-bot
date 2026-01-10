import { Injectable } from '@nestjs/common';
import { BroadcastSentRepository } from './broadcast-sent.repository';

@Injectable()
export class BroadcastSentProvider {
  constructor(private broadcastSentRepository: BroadcastSentRepository) {}

  async wasSent(broadcastName: string, chatId: number): Promise<boolean> {
    const exists = await this.broadcastSentRepository.exists({
      broadcastName,
      chatId,
    });
    return !!exists;
  }

  async markAsSent(
    broadcastName: string,
    chatId: number,
    error?: string,
  ): Promise<any> {
    return this.broadcastSentRepository.create({
      broadcastName,
      chatId,
      sentAt: new Date(),
      error,
    });
  }

  async getSentCount(broadcastName: string): Promise<number> {
    return this.broadcastSentRepository.count({ broadcastName });
  }

  async getSentList(broadcastName: string) {
    return this.broadcastSentRepository.find(
      { broadcastName },
      {},
      { sort: { sentAt: -1 } },
    );
  }
}

