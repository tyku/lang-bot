import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Feedback, FeedbackDocument } from './feedback.model';

@Injectable()
export class FeedbackRepository {
  constructor(
    @InjectModel(Feedback.name) private model: Model<Feedback>,
  ) {}

  create(data: {
    chatId: number;
    text: string;
    contextId: string;
    exerciseType: string;
  }) {
    return this.model.create(data);
  }

  find(filter: any = {}) {
    return this.model.find(filter);
  }
}

