import { Injectable } from '@nestjs/common';
import { FeedbackRepository } from './feedback.repository';

@Injectable()
export class FeedbackProvider {
  constructor(private feedbackRepo: FeedbackRepository) {}

  async create(data: {
    chatId: number;
    text: string;
    contextId: string;
    exerciseType: string;
  }) {
    return this.feedbackRepo.create(data);
  }
}

