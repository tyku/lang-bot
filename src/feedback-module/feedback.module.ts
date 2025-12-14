import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Feedback, FeedbackSchema } from './feedback.model';
import { FeedbackProvider } from './feedback.provider';
import { FeedbackRepository } from './feedback.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Feedback.name, schema: FeedbackSchema }]),
  ],
  providers: [FeedbackRepository, FeedbackProvider],
  exports: [FeedbackProvider],
})
export class FeedbackModule {}

