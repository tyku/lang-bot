import { Module, Type } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { NotificationScheduleRepository } from './notification-schedule.repository';
import { NotificationScheduleProvider } from './notification-schedule.provider';
import { NotificationSchedule, NotificationScheduleSchema } from './notification-schedule.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NotificationSchedule.name, schema: NotificationScheduleSchema },
    ]),
  ],
  providers: [
    NotificationScheduleRepository,
    NotificationScheduleProvider,
  ],
  exports: [NotificationScheduleProvider],
})
export class NotificationScheduleModule {}

