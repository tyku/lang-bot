import { Injectable } from '@nestjs/common';
import { NotificationSentRepository } from './notification-sent.repository';

@Injectable()
export class NotificationSentProvider {
  constructor(private notificationSentRepository: NotificationSentRepository) {}

  async wasSent(
    chatId: number,
    scheduledDate: Date,
    hour: number,
    minute: number,
    dayOfWeek: number,
  ): Promise<boolean> {
    // Нормализуем дату - используем начало дня для сравнения
    const dateStart = new Date(scheduledDate);
    dateStart.setHours(0, 0, 0, 0);
    
    const dateEnd = new Date(scheduledDate);
    dateEnd.setHours(23, 59, 59, 999);

    // Проверяем, было ли отправлено напоминание сегодня в это время
    const exists = await this.notificationSentRepository.findOne({
      chatId,
      scheduledDate: {
        $gte: dateStart,
        $lte: dateEnd,
      },
      hour,
      minute,
      dayOfWeek,
    });

    return !!exists;
  }

  async markAsSent(
    chatId: number,
    scheduledDate: Date,
    hour: number,
    minute: number,
    dayOfWeek: number,
  ) {
    return this.notificationSentRepository.create({
      chatId,
      scheduledDate,
      hour,
      minute,
      dayOfWeek,
    });
  }
}

