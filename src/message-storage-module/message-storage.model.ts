import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MessageStorageDocument = HydratedDocument<MessageStorage>;

export enum MessageType {
  MESSAGE = 'message',
  MENU = 'menu',
  BUTTON = 'button',
}

@Schema({ timestamps: true })
export class MessageStorage {
  @Prop({ required: true })
  chatId: number;

  @Prop({ required: true })
  messageId: number;

  @Prop({ required: true, enum: MessageType })
  type: MessageType;

  @Prop({ default: true })
  isActive: boolean;
}

export const MessageStorageSchema = SchemaFactory.createForClass(MessageStorage);
MessageStorageSchema.index({ chatId: 1, messageId: 1 }, { unique: true });
MessageStorageSchema.index({ chatId: 1, type: 1 });
MessageStorageSchema.index({ chatId: 1, isActive: 1 });





