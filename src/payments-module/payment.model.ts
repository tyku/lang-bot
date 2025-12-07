import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { EPaymentProvider, EPaymentStatus } from './constants/types';

export type PaymentDocument = HydratedDocument<Payment>;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ required: true })
  chatId: number;

  @Prop({ required: true, enum: EPaymentProvider })
  provider: EPaymentProvider;

  @Prop({ required: true, enum: EPaymentStatus, default: EPaymentStatus.PENDING })
  status: EPaymentStatus;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  tariffId: string;

  @Prop({ required: false })
  externalPaymentId?: string;

  @Prop({ type: Object, required: false })
  metadata?: Record<string, any>;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
PaymentSchema.index({ chatId: 1, createdAt: -1 });
PaymentSchema.index({ externalPaymentId: 1 }, { sparse: true });

