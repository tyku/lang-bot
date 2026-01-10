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
    // Нормализуем дату к началу дня в UTC для использования составного индекса
    const dateStart = new Date(scheduledDate);
    dateStart.setUTCHours(0, 0, 0, 0);
    
    const dateEnd = new Date(dateStart);
    dateEnd.setUTCHours(23, 59, 59, 999);

    // Используем exists() для булевого результата (более эффективно, чем findOne)
    // Проверяем с точной датой начала дня для использования составного индекса
    const exists = await this.notificationSentRepository.exists({
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

