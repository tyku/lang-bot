import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  MessageStorage,
  MessageStorageSchema,
} from './message-storage.model';
import { MessageStorageProvider } from './message-storage.provider';
import { MessageStorageRepository } from './message-storage.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MessageStorage.name, schema: MessageStorageSchema },
    ]),
  ],
  providers: [MessageStorageRepository, MessageStorageProvider],
  exports: [MessageStorageProvider],
})
export class MessageStorageModule {}


