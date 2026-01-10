import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { NotificationScheduleProvider } from './notification-schedule/notification-schedule.provider';
import { NotificationSentProvider } from './notification-sent/notification-sent.provider';
import { NotificationSenderService } from './notification-sender.service';
import { LoggerProvider } from '../logger-module/logger.provider';
import { DayOfWeek } from './notification-schedule/notification-schedule.model';
import { UserProvider } from '../user-module/user.provider';

@Processor('notification-cron')
@Injectable()
export class NotificationCronProcessor extends WorkerHost {
  constructor(
    private notificationScheduleProvider: NotificationScheduleProvider,
    private notificationSentProvider: NotificationSentProvider,
    private notificationSenderService: NotificationSenderService,
    private userProvider: UserProvider,
    private logger: LoggerProvider,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    try {
      this.logger.log('Starting notification cron job');

      // ОПТИМИЗАЦИЯ 1: Фильтрация по дню недели на уровне БД (первичный фильтр)
      // Получаем расписания для возможных дней недели, которые могут быть сейчас
      // в разных часовых поясах (UTC день и соседние дни, так как разница ±12 часов)
      const now = new Date();
      const utcDayOfWeek = now.getUTCDay() as DayOfWeek;
      const yesterdayDayOfWeek = ((utcDayOfWeek + 6) % 7) as DayOfWeek; // Предыдущий день
      const tomorrowDayOfWeek = ((utcDayOfWeek + 1) % 7) as DayOfWeek; // Следующий день

      // Получаем расписания для возможных дней недели одним запросом
      // Используем Set для удаления дубликатов (расписание может быть в нескольких днях)
      const [todaySchedules, yesterdaySchedules, tomorrowSchedules] =
        await Promise.all([
          this.notificationScheduleProvider.findActiveByDayOfWeek(utcDayOfWeek),
          this.notificationScheduleProvider.findActiveByDayOfWeek(
            yesterdayDayOfWeek,
          ),
          this.notificationScheduleProvider.findActiveByDayOfWeek(
            tomorrowDayOfWeek,
          ),
        ]);

      // Объединяем и удаляем дубликаты по chatId
      const scheduleMap = new Map();
      [...todaySchedules, ...yesterdaySchedules, ...tomorrowSchedules].forEach(
        (schedule) => {
          scheduleMap.set(schedule.chatId, schedule);
        },
      );
      const allActiveSchedules = Array.from(scheduleMap.values());

      this.logger.log(
        `Found ${allActiveSchedules.length} active notification schedules (for UTC days: ${utcDayOfWeek}, ${yesterdayDayOfWeek}, ${tomorrowDayOfWeek})`,
      );

      if (allActiveSchedules.length === 0) {
        this.logger.log('No active schedules found, exiting');
        return;
      }

      // ОПТИМИЗАЦИЯ 2: Batch загрузка пользователей (устранение N+1)
      // Загружаем всех пользователей одним запросом вместо N отдельных запросов
      const chatIds = allActiveSchedules.map((schedule) => schedule.chatId);
      const users = await this.userProvider.findByChatIds(chatIds);
      const userMap = new Map(users.map((user) => [user.chatId, user]));

      this.logger.log(`Loaded ${users.length} users in batch`);

      // Обрабатываем расписания батчами для параллельной обработки
      const batchSize = 50;
      for (let i = 0; i < allActiveSchedules.length; i += batchSize) {
        const batch = allActiveSchedules.slice(i, i + batchSize);
        
        // Обрабатываем батч параллельно
        await Promise.all(
          batch.map((schedule) =>
            this.processSchedule(schedule, userMap),
          ),
        );
      }

      this.logger.log('Notification cron job completed');
    } catch (error: any) {
      this.logger.error(
        `Error in notification cron job: ${error?.message || error}`,
      );
      throw error;
    }
  }

  private async processSchedule(
    schedule: any,
    userMap: Map<number, any>,
  ): Promise<void> {
    try {
      // Получаем пользователя из Map (уже загружен в batch, нет дополнительного запроса к БД)
      const user = userMap.get(schedule.chatId);
      const timezone = user?.timezone || 'Europe/Moscow';

      // Получаем текущее время в часовом поясе пользователя
      const now = new Date();
      const userNow = toZonedTime(now, timezone);
      const userDayOfWeek = userNow.getDay() as DayOfWeek;
      const userHour = userNow.getHours();
      const userMinute = userNow.getMinutes();

      // ОПТИМИЗАЦИЯ 1: Проверка дня недели (фильтруем ДО всех запросов к БД)
      // Проверяем, соответствует ли текущий день недели пользователя расписанию
      if (!schedule.daysOfWeek.includes(userDayOfWeek)) {
        return; // Не подходящий день недели, пропускаем
      }

      // ОПТИМИЗАЦИЯ 3: Предварительная фильтрация времен (фильтруем ДО запросов к БД)
      // Фильтруем времена, которые попадают в окно текущего времени ±5 минут
      // Это уменьшает количество запросов wasSent к БД
      const relevantTimes = schedule.times.filter((time: any) => {
        // Проверяем, попадает ли текущее время в интервал ±5 минут от запланированного
        if (userHour === time.hour) {
          return Math.abs(userMinute - time.minute) <= 1;
        }
        return false;
      });

      if (relevantTimes.length === 0) {
        return; // Нет подходящих времен, пропускаем (нет запросов к БД)
      }

      // Обрабатываем только релевантные времена
      for (const time of relevantTimes) {
        // Формируем дату для проверки отправки в часовом поясе пользователя
        const nowInUserTz = toZonedTime(new Date(), timezone);
        const userScheduledDate = new Date(nowInUserTz);
        userScheduledDate.setHours(time.hour, time.minute, 0, 0);
        userScheduledDate.setSeconds(0, 0);
        userScheduledDate.setMilliseconds(0);

        // Конвертируем в UTC для хранения в базе
        const scheduledDate = fromZonedTime(userScheduledDate, timezone);

        // Проверяем, было ли уже отправлено напоминание на сегодня в это время
        const wasSent = await this.notificationSentProvider.wasSent(
          schedule.chatId,
          scheduledDate,
          time.hour,
          time.minute,
          userDayOfWeek,
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
              userDayOfWeek,
            );

            this.logger.log(
              `Notification sent to chatId: ${schedule.chatId} at ${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')} (timezone: ${timezone})`,
            );
          }
        } else {
          this.logger.log(
            `Notification already sent to chatId: ${schedule.chatId} at ${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}, skipping`,
          );
        }
      }
    } catch (error: any) {
      this.logger.error(
        `Error processing schedule for chatId ${schedule.chatId}: ${error?.message || error}`,
      );
    }
  }
}

