import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BroadcastDocument = HydratedDocument<Broadcast>;

@Schema({ timestamps: true })
export class Broadcast {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, default: true })
  isActive: boolean;

  @Prop({ required: true, type: String })
  content: string;
}

export const BroadcastSchema = SchemaFactory.createForClass(Broadcast);
BroadcastSchema.index({ isActive: 1 });
BroadcastSchema.index({ name: 1 }, { unique: true });

