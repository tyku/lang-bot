import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ChatDocument = HydratedDocument<Chat>;

@Schema({ timestamps: true })
export class Chat {
  @Prop({ required: true })
  chatId: string;

  @Prop({ required: true })
  contextId: string;

  @Prop({ required: true })
  contextAlias: string;

  @Prop()
  content: { question: string; answer: string }[];

  @Prop({ default: true })
  isActive: boolean;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
ChatSchema.index({ chatId: 1 }, { unique: true });
