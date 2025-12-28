import { FilterQuery, Model, ProjectionType, QueryOptions, mongo } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { MessageStorage, MessageStorageDocument, MessageType } from './message-storage.model';

@Injectable()
export class MessageStorageRepository {
  constructor(
    @InjectModel(MessageStorage.name) private model: Model<MessageStorage>,
  ) {}

  create(chatId: number, messageId: number, type: MessageType) {
    return this.model.create({ chatId, messageId, type });
  }

  find(
    filter: FilterQuery<MessageStorageDocument> = {},
    projection?: ProjectionType<MessageStorageDocument>,
    options?: QueryOptions<MessageStorageDocument>,
  ) {
    return this.model.find<MessageStorageDocument>(filter, projection, options);
  }

  findOne(
    filter: FilterQuery<MessageStorageDocument> = {},
    projection?: ProjectionType<MessageStorageDocument>,
    options?: QueryOptions<MessageStorageDocument>,
  ) {
    return this.model.findOne<MessageStorageDocument>(
      filter,
      projection,
      options,
    );
  }

  deleteMany(filter: FilterQuery<MessageStorageDocument>): Promise<mongo.DeleteResult> {
    return this.model.deleteMany(filter);
  }

  updateMany(
    filter: FilterQuery<MessageStorageDocument>,
    update: Partial<MessageStorage>,
  ): Promise<mongo.UpdateResult> {
    return this.model.updateMany(filter, update);
  }
}

