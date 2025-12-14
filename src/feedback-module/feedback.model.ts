import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type FeedbackDocument = HydratedDocument<Feedback>;

@Schema({ timestamps: true })
export class Feedback {
  @Prop({ required: true })
  chatId: number;

  @Prop({ required: true })
  text: string;

  @Prop({ required: true })
  contextId: string;

  @Prop({ required: true })
  exerciseType: string;
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);

