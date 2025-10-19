import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ExercisesDocument = HydratedDocument<Exercises>;

@Schema({ timestamps: true })
export class Exercises {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  alias: string;

  @Prop({ require: true })
  description: string;

  @Prop({ required: true })
  promptQuestion: string;

  @Prop({ required: true })
  promptAnswer: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const ExercisesSchema = SchemaFactory.createForClass(Exercises);
// ExercisesSchema.index({ alias: 1 }, { unique: true });
