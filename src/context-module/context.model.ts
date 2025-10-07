import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ContextDocument = HydratedDocument<Context>;

@Schema({ timestamps: true })
export class Context {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  alias: string;

  @Prop({ required: true })
  promptQuestion: string;

  @Prop({ required: true })
  promptAnswer: string;

  @Prop()
  promptRule: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const ContextSchema = SchemaFactory.createForClass(Context);
ContextSchema.index({ chatId: 1 }, { unique: true });
