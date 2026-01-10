import { Module, Type } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { NotificationScheduleModule } from './notification-schedule/notification-schedule.module';
import { NotificationScheduleProvider } from './notification-schedule/notification-schedule.provider';
import { NotificationSentModule } from './notification-sent/notification-sent.module';
import { NotificationSentProvider } from './notification-sent/notification-sent.provider';
import { NotificationCronProcessor } from './notification-cron.processor';
import { NotificationCronService } from './notification-cron.service';
import { NotificationSenderService } from './notification-sender.service';
import { LoggerModule } from '../logger-module/logger.module';

@Module({
  imports: [
    NotificationScheduleModule,
    NotificationSentModule,
    BullModule.registerQueue({
      name: 'notification-cron',
    }),
    LoggerModule,
  ],
  providers: [
    NotificationCronProcessor,
    NotificationCronService,
    NotificationSenderService,
  ],
  exports: [
    NotificationScheduleModule,
    NotificationSentModule,
  ],
})
export class NotificationModule {}

