import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type NotificationScheduleDocument = HydratedDocument<NotificationSchedule>;

export interface ScheduleTime {
  hour: number;
  minute: number;
}

export enum DayOfWeek {
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
  SUNDAY = 0,
}

@Schema({ timestamps: true })
export class NotificationSchedule {
  @Prop({ required: true, index: true })
  chatId: number;

  @Prop({ type: [Number], required: true })
  daysOfWeek: DayOfWeek[];

  @Prop({
    type: [
      {
        hour: { type: Number, required: true },
        minute: { type: Number, required: true },
      },
    ],
    required: true,
    validate: [
      {
        validator: function (times: ScheduleTime[]) {
          return times.length > 0 && times.length <= 3;
        },
        message: 'Можно задать от 1 до 3 напоминаний в сутки',
      },
      {
        validator: function (times: ScheduleTime[]) {
          return times.every(
            (time) =>
              time.hour >= 0 &&
              time.hour < 24 &&
              time.minute >= 0 &&
              time.minute < 60 &&
              time.minute % 15 === 0,
          );
        },
        message: 'Время должно быть кратно 15 минутам (00, 15, 30, 45)',
      },
    ],
  })
  times: ScheduleTime[];

  @Prop({ default: true })
  isActive: boolean;
}

export const NotificationScheduleSchema =
  SchemaFactory.createForClass(NotificationSchedule);
NotificationScheduleSchema.index({ chatId: 1 }, { unique: true });
NotificationScheduleSchema.index({ isActive: 1 });

