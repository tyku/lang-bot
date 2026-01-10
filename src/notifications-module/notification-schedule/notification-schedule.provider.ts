import { Injectable } from '@nestjs/common';
import { NotificationScheduleRepository } from './notification-schedule.repository';
import {
  NotificationSchedule,
  DayOfWeek,
  ScheduleTime,
} from './notification-schedule.model';

@Injectable()
export class NotificationScheduleProvider {
  constructor(
    private notificationScheduleRepository: NotificationScheduleRepository,
  ) {}

  createOrUpdate(chatId: number, data: Partial<NotificationSchedule>) {
    return this.notificationScheduleRepository.findOneAndUpdate(
      { chatId },
      data,
    );
  }

  findByChatId(chatId: number) {
    return this.notificationScheduleRepository.findOne({ chatId });
  }

  findAllActive() {
    return this.notificationScheduleRepository.find({ isActive: true });
  }

  findActiveByDayOfWeek(dayOfWeek: DayOfWeek) {
    return this.notificationScheduleRepository.findActiveByDayOfWeek(dayOfWeek);
  }

  updateStatus(chatId: number, isActive: boolean) {
    return this.notificationScheduleRepository.updateOne(
      { chatId },
      { isActive },
    );
  }

  delete(chatId: number): Promise<any> {
    return this.notificationScheduleRepository.deleteOne({ chatId });
  }
}

