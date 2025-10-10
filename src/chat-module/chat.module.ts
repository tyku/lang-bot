import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Chat, ChatSchema } from './chat.model';
import { ChatProvider } from './chat.provider';
import { ChatRepository } from './chat.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Chat.name, schema: ChatSchema }]),
  ],
  providers: [ChatRepository, ChatProvider],
  exports: [ChatProvider],
})
export class ChatModule {}
