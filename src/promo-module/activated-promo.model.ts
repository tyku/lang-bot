import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ActivatedPromoDocument = HydratedDocument<ActivatedPromo>;

@Schema({ timestamps: true })
export class ActivatedPromo {
  @Prop({ required: true })
  chatId: number;

  @Prop({ required: true })
  code: string;

  @Prop({ default: new Date() })
  appliedAt: Date;
}

export const ActivatedPromoSchema =
  SchemaFactory.createForClass(ActivatedPromo);
ActivatedPromoSchema.index({ chatId: 1, code: 1 }, { unique: true });
