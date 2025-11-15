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

  @Prop({ default: 1 })
  order: number;

  @Prop()
  promptRule: string;

  @Prop()
  rule: string;

  @Prop()
  exercises: string[];

  @Prop({ default: false })
  isFree: boolean;

  @Prop({ default: true })
  isActive: boolean;
}

export const ContextSchema = SchemaFactory.createForClass(Context);
ContextSchema.index({ alias: 1 }, { unique: true });
