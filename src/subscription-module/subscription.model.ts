import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ESubscriptionType } from './constants/types';

export type SubscriptionDocument = HydratedDocument<Subscription>;

@Schema({ timestamps: true })
export class Subscription {
  @Prop({ required: true })
  chatId: number;

  @Prop({ required: true, enum: ESubscriptionType })
  type: ESubscriptionType;

  @Prop({ required: true })
  dateFrom: Date;

  @Prop()
  dateTo: Date;
}

export const SubscriptionsSchema = SchemaFactory.createForClass(Subscription);
SubscriptionsSchema.index({ chatId: 1, code: 1 }, { unique: true });
SubscriptionsSchema.index({ chatId: 1, dateTo: 1 });
