import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { NotificationScheduleProvider } from './notification-schedule/notification-schedule.provider';
import { NotificationSentProvider } from './notification-sent/notification-sent.provider';
import { NotificationSenderService } from './notification-sender.service';
import { LoggerProvider } from '../logger-module/logger.provider';
import { DayOfWeek } from './notification-schedule/notification-schedule.model';

@Processor('notification-cron')
@Injectable()
export class NotificationCronProcessor extends WorkerHost {
  constructor(
    private notificationScheduleProvider: NotificationScheduleProvider,
    private notificationSentProvider: NotificationSentProvider,
    private notificationSenderService: NotificationSenderService,
    private logger: LoggerProvider,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    try {
      this.logger.log('Starting notification cron job');

      const now = new Date();
      const currentDayOfWeek = now.getDay() as DayOfWeek; // 0 = Sunday, 1 = Monday, etc.
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // Получаем все активные расписания
      const activeSchedules =
        await this.notificationScheduleProvider.findAllActive();

      this.logger.log(
        `Found ${activeSchedules.length} active notification schedules`,
      );

      // Проходим по каждому расписанию
      for (const schedule of activeSchedules) {
        try {
          // Проверяем, соответствует ли текущий день недели расписанию
          if (!schedule.daysOfWeek.includes(currentDayOfWeek)) {
            continue;
          }

          // Проверяем каждое время в расписании
          for (const time of schedule.times) {
            // Проверяем, попадает ли текущее время в интервал ±1 минута от запланированного времени
            // Сначала проверяем часы, затем минуты
            if (
              currentHour === time.hour &&
              Math.abs(currentMinute - time.minute) <= 1
            ) {
              // Формируем дату для проверки отправки (сегодня, с точным временем расписания)
              const scheduledDate = new Date(now);
              scheduledDate.setHours(time.hour, time.minute, 0, 0);
              scheduledDate.setSeconds(0, 0);

              // Проверяем, было ли уже отправлено напоминание на сегодня в это время
              const wasSent = await this.notificationSentProvider.wasSent(
                schedule.chatId,
                scheduledDate,
                time.hour,
                time.minute,
                currentDayOfWeek,
              );

              if (!wasSent) {
                // Отправляем уведомление
                const sent = await this.notificationSenderService.sendNotification(
                  schedule.chatId,
                );

                if (sent) {
                  // Помечаем как отправленное
                  await this.notificationSentProvider.markAsSent(
                    schedule.chatId,
                    scheduledDate,
                    time.hour,
                    time.minute,
                    currentDayOfWeek,
                  );

                  this.logger.log(
                    `Notification sent to chatId: ${schedule.chatId} at ${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`,
                  );
                }
              } else {
                this.logger.log(
                  `Notification already sent to chatId: ${schedule.chatId} at ${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}, skipping`,
                );
              }
            }
          }
        } catch (error: any) {
          this.logger.error(
            `Error processing schedule for chatId ${schedule.chatId}: ${error?.message || error}`,
          );
        }
      }

      this.logger.log('Notification cron job completed');
    } catch (error: any) {
      this.logger.error(
        `Error in notification cron job: ${error?.message || error}`,
      );
      throw error;
    }
  }
}

