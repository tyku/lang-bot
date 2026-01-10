import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type NotificationSentDocument = HydratedDocument<NotificationSent>;

@Schema({ timestamps: true })
export class NotificationSent {
  @Prop({ required: true, index: true })
  chatId: number;

  @Prop({ required: true, index: true })
  scheduledDate: Date;

  @Prop({ required: true })
  hour: number;

  @Prop({ required: true })
  minute: number;

  @Prop({ required: true, index: true })
  dayOfWeek: number;
}

export const NotificationSentSchema =
  SchemaFactory.createForClass(NotificationSent);
// Индекс для быстрого поиска по chatId, дню недели, часу и минуте
NotificationSentSchema.index({ chatId: 1, dayOfWeek: 1, hour: 1, minute: 1, scheduledDate: 1 });
// Уникальный индекс для предотвращения дублей на одну и ту же дату
NotificationSentSchema.index({ chatId: 1, scheduledDate: 1, hour: 1, minute: 1 }, { unique: true });

