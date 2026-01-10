import { Module, Type } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { NotificationSentRepository } from './notification-sent.repository';
import { NotificationSentProvider } from './notification-sent.provider';
import { NotificationSent, NotificationSentSchema } from './notification-sent.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NotificationSent.name, schema: NotificationSentSchema },
    ]),
  ],
  providers: [
    NotificationSentRepository as Type<any>,
    NotificationSentProvider as Type<any>,
  ],
  exports: [NotificationSentProvider],
})
export class NotificationSentModule {}

