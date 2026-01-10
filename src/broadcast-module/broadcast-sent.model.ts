import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BroadcastSentDocument = HydratedDocument<BroadcastSent>;

@Schema({ timestamps: true })
export class BroadcastSent {
  @Prop({ required: true, index: true })
  broadcastName: string;

  @Prop({ required: true, index: true })
  chatId: number;

  @Prop({ required: true, default: Date.now, index: true })
  sentAt: Date;

  @Prop({ required: false })
  error?: string;
}

export const BroadcastSentSchema = SchemaFactory.createForClass(BroadcastSent);
// Составной индекс для быстрой проверки, была ли отправлена рассылка пользователю
BroadcastSentSchema.index({ broadcastName: 1, chatId: 1 }, { unique: true });
// Индекс для поиска всех отправок по рассылке
BroadcastSentSchema.index({ broadcastName: 1, sentAt: -1 });

