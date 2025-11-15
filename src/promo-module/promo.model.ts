import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as TShcema } from 'mongoose';

export type PromoDocument = HydratedDocument<Promo>;

@Schema({ timestamps: true })
export class Promo {
  @Prop({ required: true, type: String })
  code: string;

  @Prop({ type: String })
  type: string;

  @Prop({ type: Date })
  expiresAt: Date;

  @Prop({ type: TShcema.Types.Mixed })
  data: Record<string, any>;
}

export const PromoSchema = SchemaFactory.createForClass(Promo);
PromoSchema.index({ chat: 1, code: 1 }, { unique: true });
