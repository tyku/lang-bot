import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { LoggerProvider } from '../logger-module/logger.provider';

@Injectable()
export class NotificationCronService implements OnModuleInit {
  constructor(
    @InjectQueue('notification-cron') private notificationQueue: Queue,
    private logger: LoggerProvider,
  ) {}

  async onModuleInit() {
    try {
      // Проверяем, существует ли уже повторяющаяся задача
      const repeatableJobs = await this.notificationQueue.getRepeatableJobs();
      const existingJob = repeatableJobs.find(
        (job) => job.id === 'notification-cron-job',
      );

      if (!existingJob) {
        // Добавляем повторяющуюся задачу каждые 5 минут
        await this.notificationQueue.add(
          'check-notifications',
          {},
          {
            repeat: {
              pattern: '*/5 * * * *', // Каждые 5 минут
            },
            jobId: 'notification-cron-job',
          },
        );

        this.logger.log('Notification cron job scheduled (every 5 minutes)');
      } else {
        this.logger.log(
          'Notification cron job already exists, skipping creation',
        );
      }
    } catch (error: any) {
      this.logger.error(
        `Failed to schedule notification cron job: ${error?.message || error}`,
      );
    }
  }
}

