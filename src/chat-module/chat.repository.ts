import { FilterQuery, Model, ProjectionType, QueryOptions } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Chat, ChatDocument } from './chat.model';

@Injectable()
export class ChatRepository {
  constructor(@InjectModel(Chat.name) private model: Model<Chat>) {}

  addContentOrCreate(
    chatId: number,
    contextId: string,
    data: Partial<{ question: string; answer: string }>,
  ) {
    return this.model.findOneAndUpdate(
      { chatId, contextId },
      {
        $push: {
          content: {
            $each: [data],
            $slice: -100,
          },
        },
      },
      { new: true, upsert: true },
    );
  }

  find(
    filter: FilterQuery<ChatDocument> = {},
    projection?: ProjectionType<ChatDocument>,
    options?: QueryOptions<ChatDocument>,
  ) {
    return this.model.find<ChatDocument>(filter, projection, options);
  }

  findOne(
    filter: FilterQuery<ChatDocument> = {},
    projection?: ProjectionType<ChatDocument>,
    options?: QueryOptions<ChatDocument>,
  ) {
    return this.model.findOne<ChatDocument>(filter, projection, options);
  }
}
