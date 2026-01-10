import {
  Action,
  Ctx,
  Scene,
  SceneEnter,
  SceneLeave,
} from 'nestjs-telegraf';
import { InlineKeyboardButton } from 'telegraf/types';
import { Scenes } from 'telegraf';
import { NotificationScheduleProvider } from '../../notifications-module/notification-schedule/notification-schedule.provider';
import {
  DayOfWeek,
  ScheduleTime,
} from '../../notifications-module/notification-schedule/notification-schedule.model';
import { escapeText } from '../libs/text-format';

const DAY_NAMES = {
  [DayOfWeek.MONDAY]: 'Понедельник',
  [DayOfWeek.TUESDAY]: 'Вторник',
  [DayOfWeek.WEDNESDAY]: 'Среда',
  [DayOfWeek.THURSDAY]: 'Четверг',
  [DayOfWeek.FRIDAY]: 'Пятница',
  [DayOfWeek.SATURDAY]: 'Суббота',
  [DayOfWeek.SUNDAY]: 'Воскресенье',
};

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);
const MINUTE_OPTIONS = [0, 15, 30, 45];

type TSession = {
  selectedDays?: DayOfWeek[];
  selectedTimes?: ScheduleTime[];
  currentStep?: 'days' | 'hours' | 'minutes' | 'confirm';
  timeIndex?: number;
  selectingHour?: boolean;
};

@Scene('NOTIFICATION_SCHEDULE_SCENE_ID')
export class NotificationScheduleScene {
  constructor(
    private notificationScheduleProvider: NotificationScheduleProvider,
  ) {}

  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: Scenes.SceneContext & { session?: TSession }) {
    const chatId =
      (ctx.update as any)?.message?.chat?.id ||
      (ctx.update as any)?.callback_query?.message?.chat?.id;

    if (!chatId) {
      await ctx.reply('Ошибка: не удалось определить chatId');
      return;
    }

    // Проверяем существующее расписание
    // const existingSchedule = await this.notificationScheduleProvider.findByChatId(
    //   chatId,
    // );

    // if (existingSchedule) {
    //   const daysText = existingSchedule.daysOfWeek
    //     .map((d) => DAY_NAMES[d])
    //     .join(', ');
    //   const timesText = existingSchedule.times
    //     .map((t) => `${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}`)
    //     .join(', ');

    //   const statusText = existingSchedule.isActive ? '✅ Включено' : '❌ Выключено';

    //   await ctx.reply(
    //     `📅 Текущее расписание:\n\n` +
    //     `Дни: ${daysText}\n` +
    //     `Время: ${timesText}\n` +
    //     `Статус: ${statusText}\n\n` +
    //     `Что вы хотите сделать?`,
    //     {
    //       reply_markup: {
    //         inline_keyboard: [
    //           [
    //             { text: '✏️ Изменить', callback_data: 'edit' },
    //             { text: existingSchedule.isActive ? '⏸ Выключить' : '▶️ Включить', callback_data: 'toggle' },
    //           ],
    //           [{ text: '🗑 Удалить', callback_data: 'delete' }],
    //           [{ text: '❌ Отмена', callback_data: 'cancel' }],
    //         ],
    //       },
    //     },
    //   );
    //   return;
    // }

    // Инициализируем новое расписание
    ctx.session = {
      selectedDays: [],
      selectedTimes: [],
      currentStep: 'days',
    };

    await this.showDaysSelection(ctx);
  }

  private async showDaysSelection(
    ctx: Scenes.SceneContext & { session?: TSession },
  ) {
    const session = ctx.session || {};
    const selectedDays = session.selectedDays || [];

    const buttons: InlineKeyboardButton[][] = [];
    const allDays = [
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY,
      DayOfWeek.SUNDAY,
    ];

    // Создаем кнопки для выбора дней
    // for (let i = 0; i < allDays.length; i += 2) {
    //   const day1 = allDays[i];
    //   const day2 = allDays[i + 1];
    //   const row: InlineKeyboardButton[] = [];

    //   const day1Text = selectedDays.includes(day1) ? `✅ ${DAY_NAMES[day1]}` : DAY_NAMES[day1];
    //   row.push({ text: day1Text, callback_data: `day:${day1}` });

    //   if (day2 !== undefined) {
    //     const day2Text = selectedDays.includes(day2) ? `✅ ${DAY_NAMES[day2]}` : DAY_NAMES[day2];
    //     row.push({ text: day2Text, callback_data: `day:${day2}` });
    //   }

    //   buttons.push(row);
    // }

const btn: InlineKeyboardButton[][] = [];

    btn.push([
      { text: '✅ Готово', callback_data: 'days_done' },
      // { text: '❌ Отмена', callback_data: 'cancel' },
    ]);

    await ctx.replyWithMarkdownV2(escapeText('📅 Выберите дни недели для напоминаний:'), {
      reply_markup: {
        inline_keyboard: btn,
      },
    });
  }

  // @On('callback_query')
  // async onCallbackQuery(
  //   @Ctx() ctx: Scenes.SceneContext & { session?: TSession; update?: { callback_query?: any } },
  //   @Next() next: () => Promise<void>,
  // ) {
  //   const callbackData = ctx.update?.callback_query?.data;
    
  //   if (!callbackData) {
  //     return next();
  //   }

  //   try {
  //     await ctx.answerCbQuery();
  //   } catch (e) {}

  //   // Обрабатываем все действия в одном месте
  //   if (callbackData.startsWith('day:')) {
  //     const day = Number(callbackData.split(':')[1]) as DayOfWeek;
  //     const session = ctx.session || { selectedDays: [] };
  //     const selectedDays = session.selectedDays || [];

  //     if (selectedDays.includes(day)) {
  //       session.selectedDays = selectedDays.filter((d) => d !== day);
  //     } else {
  //       session.selectedDays = [...selectedDays, day];
  //     }

  //     ctx.session = session;

  //     try {
  //       await ctx.deleteMessage();
  //     } catch (e) {}

  //     await this.showDaysSelection(ctx);
  //     return;
  //   }

  //   if (callbackData.startsWith('hour:')) {
  //     const hour = Number(callbackData.split(':')[1]);
  //     const session = ctx.session || {};
  //     const selectedTimes = session.selectedTimes || [];
  //     const timeIndex = session.timeIndex || 0;

  //     if (!selectedTimes[timeIndex]) {
  //       selectedTimes[timeIndex] = { hour, minute: 0 };
  //     } else {
  //       selectedTimes[timeIndex].hour = hour;
  //     }

  //     session.selectedTimes = selectedTimes;
  //     session.selectingHour = false;
  //     ctx.session = session;

  //     try {
  //       await ctx.deleteMessage();
  //     } catch (e) {}

  //     await this.showMinuteSelection(ctx);
  //     return;
  //   }

  //   if (callbackData.startsWith('minute:')) {
  //     const minute = Number(callbackData.split(':')[1]);
  //     const session = ctx.session || {};
  //     const selectedTimes = session.selectedTimes || [];
  //     const timeIndex = session.timeIndex || 0;

  //     if (!selectedTimes[timeIndex]) {
  //       selectedTimes[timeIndex] = { hour: 9, minute };
  //     } else {
  //       selectedTimes[timeIndex].minute = minute;
  //     }

  //     session.selectedTimes = selectedTimes;
  //     session.timeIndex = (timeIndex || 0) + 1;
  //     ctx.session = session;

  //     try {
  //       await ctx.deleteMessage();
  //     } catch (e) {}

  //     if (selectedTimes.length >= 3 || session.timeIndex >= 3) {
  //       await this.showConfirmation(ctx);
  //     } else {
  //       await ctx.reply(
  //         `✅ Время ${selectedTimes.length} добавлено!\n\n` +
  //         `Хотите добавить еще одно время? (максимум 3)`,
  //         {
  //           reply_markup: {
  //             inline_keyboard: [
  //               [
  //                 { text: '➕ Добавить еще', callback_data: 'add_time' },
  //                 { text: '✅ Готово', callback_data: 'times_done' },
  //               ],
  //               [{ text: '❌ Отмена', callback_data: 'cancel' }],
  //             ],
  //           },
  //         },
  //       );
  //     }
  //     return;
  //   }

  //   // Для остальных действий вызываем next, чтобы они обработались через @Action
  //   return next();
  // }

  @Action('days_done')
  async onDaysDone(@Ctx() ctx: Scenes.SceneContext & { session?: TSession }) {
    console.log('===============');

  
  
    // try {
    //   await ctx.answerCbQuery();
    // } catch (e) {}

    // const session = ctx.session || {};
    // const selectedDays = session.selectedDays || [];

    // if (selectedDays.length === 0) {
    //   await ctx.reply('❌ Пожалуйста, выберите хотя бы один день');
    //   return;
    // }

    // session.currentStep = 'hours';
    // session.selectedTimes = [];
    // session.timeIndex = 0;
    // ctx.session = session;

    // try {
    //   await ctx.deleteMessage();
    // } catch (e) {}

    // await this.showTimeSelection(ctx);
  }

  private async showTimeSelection(
    ctx: Scenes.SceneContext & { session?: TSession },
  ) {
    const session = ctx.session || {};
    const selectedTimes = session.selectedTimes || [];
    const timeIndex = session.timeIndex || 0;

    if (selectedTimes.length >= 3) {
      await this.showConfirmation(ctx);
      return;
    }

    const currentTime = selectedTimes[timeIndex] || { hour: 9, minute: 0 };

    await ctx.reply(
      `⏰ Напоминание ${timeIndex + 1} из 3 (максимум)\n\n` +
      `Выберите час (0-23):`,
      {
        reply_markup: {
          inline_keyboard: [
            ...Array.from({ length: 6 }, (_, i) => {
              const row: InlineKeyboardButton[] = [];
              for (let j = 0; j < 4 && i * 4 + j < 24; j++) {
                const hour = i * 4 + j;
                const text = hour === currentTime.hour ? `✅ ${hour}` : String(hour);
                row.push({ text, callback_data: `hour:${hour}` });
              }
              return row;
            }),
            selectedTimes.length > 0
              ? [{ text: '✅ Готово', callback_data: 'times_done' }]
              : [],
            [{ text: '❌ Отмена', callback_data: 'cancel' }],
          ],
        },
      },
    );
  }


  private async showMinuteSelection(
    ctx: Scenes.SceneContext & { session?: TSession },
  ) {
    const session = ctx.session || {};
    const selectedTimes = session.selectedTimes || [];
    const timeIndex = session.timeIndex || 0;
    const currentTime = selectedTimes[timeIndex] || { hour: 9, minute: 0 };

    await ctx.reply(
      `⏰ Напоминание ${timeIndex + 1} из 3\n` +
      `Час: ${currentTime.hour}\n` +
      `Выберите минуты (кратно 15):`,
      {
        reply_markup: {
          inline_keyboard: [
            MINUTE_OPTIONS.map((minute) => ({
              text:
                minute === currentTime.minute
                  ? `✅ ${String(minute).padStart(2, '0')}`
                  : String(minute).padStart(2, '0'),
              callback_data: `minute:${minute}`,
            })),
            [{ text: '❌ Отмена', callback_data: 'cancel' }],
          ],
        },
      },
    );
  }


  // @Action('add_time')
  // async onAddTime(@Ctx() ctx: Scenes.SceneContext & { session?: TSession }) {
  //   try {
  //     await ctx.answerCbQuery();
  //   } catch (e) {}

  //   try {
  //     await ctx.deleteMessage();
  //   } catch (e) {}

  //   await this.showTimeSelection(ctx);
  // }

  // @Action('times_done')
  // async onTimesDone(@Ctx() ctx: Scenes.SceneContext & { session?: TSession }) {
  //   try {
  //     await ctx.answerCbQuery();
  //   } catch (e) {}

  //   const session = ctx.session || {};
  //   const selectedTimes = session.selectedTimes || [];

  //   if (selectedTimes.length === 0) {
  //     await ctx.reply('❌ Пожалуйста, выберите хотя бы одно время');
  //     return;
  //   }

  //   try {
  //     await ctx.deleteMessage();
  //   } catch (e) {}

  //   await this.showConfirmation(ctx);
  // }

  private async showConfirmation(
    ctx: Scenes.SceneContext & { session?: TSession },
  ) {
    const session = ctx.session || {};
    const selectedDays = session.selectedDays || [];
    const selectedTimes = session.selectedTimes || [];

    const daysText = selectedDays
      .sort((a, b) => a - b)
      .map((d) => DAY_NAMES[d])
      .join(', ');

    const timesText = selectedTimes
      .map((t) => `${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}`)
      .join(', ');

    await ctx.reply(
      `📋 Подтвердите расписание:\n\n` +
      `📅 Дни: ${daysText}\n` +
      `⏰ Время: ${timesText}\n\n` +
      `Сохранить?`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Сохранить', callback_data: 'confirm' },
              { text: '❌ Отмена', callback_data: 'cancel' },
            ],
          ],
        },
      },
    );
  }

  // @Action('confirm')
  // async onConfirm(@Ctx() ctx: Scenes.SceneContext & { session?: TSession; update?: { callback_query?: any } }) {
  //   try {
  //     await ctx.answerCbQuery();
  //   } catch (e) {}

  //   const chatId = ctx.update?.callback_query?.message?.chat?.id;

  //   if (!chatId) {
  //     await ctx.reply('Ошибка: не удалось определить chatId');
  //     return;
  //   }

  //   const session = ctx.session || {};
  //   const selectedDays = session.selectedDays || [];
  //   const selectedTimes = session.selectedTimes || [];

  //   if (selectedDays.length === 0 || selectedTimes.length === 0) {
  //     await ctx.reply('❌ Ошибка: не заполнены все поля');
  //     return;
  //   }

  //   // Сортируем дни и время
  //   const sortedDays = [...selectedDays].sort((a, b) => a - b);
  //   const sortedTimes = [...selectedTimes].sort((a, b) => {
  //     if (a.hour !== b.hour) return a.hour - b.hour;
  //     return a.minute - b.minute;
  //   });

  //   try {
  //     await this.notificationScheduleProvider.createOrUpdate(chatId, {
  //       chatId,
  //       daysOfWeek: sortedDays,
  //       times: sortedTimes,
  //       isActive: true,
  //     });

  //     try {
  //       await ctx.deleteMessage();
  //     } catch (e) {}

  //     await ctx.reply('✅ Расписание успешно сохранено!');

  //     await ctx.scene.leave();
  //     await ctx.scene.enter('MENU_SCENE_ID');
  //   } catch (error: any) {
  //     await ctx.reply(
  //       `❌ Ошибка при сохранении расписания: ${error?.message || 'Неизвестная ошибка'}`,
  //     );
  //   }
  // }

  // @Action('toggle')
  // async onToggle(@Ctx() ctx: Scenes.SceneContext & { update?: { callback_query?: any } }) {
  //   try {
  //     await ctx.answerCbQuery();
  //   } catch (e) {}

  //   const chatId = ctx.update?.callback_query?.message?.chat?.id;

  //   if (!chatId) {
  //     await ctx.reply('Ошибка: не удалось определить chatId');
  //     return;
  //   }

  //   const existingSchedule =
  //     await this.notificationScheduleProvider.findByChatId(chatId);

  //   if (!existingSchedule) {
  //     await ctx.reply('❌ Расписание не найдено');
  //     return;
  //   }

  //   const newStatus = !existingSchedule.isActive;
  //   await this.notificationScheduleProvider.updateStatus(chatId, newStatus);

  //   try {
  //     await ctx.deleteMessage();
  //   } catch (e) {}

  //   await ctx.reply(
  //     `✅ Напоминания ${newStatus ? 'включены' : 'выключены'}`,
  //   );

  //   await ctx.scene.leave();
  //   await ctx.scene.enter('MENU_SCENE_ID');
  // }

  // @Action('edit')
  // async onEdit(@Ctx() ctx: Scenes.SceneContext & { session?: TSession; update?: { callback_query?: any } }) {
  //   try {
  //     await ctx.answerCbQuery();
  //   } catch (e) {}

  //   const chatId = ctx.update?.callback_query?.message?.chat?.id;

  //   if (!chatId) {
  //     await ctx.reply('Ошибка: не удалось определить chatId');
  //     return;
  //   }

  //   const existingSchedule =
  //     await this.notificationScheduleProvider.findByChatId(chatId);

  //   if (!existingSchedule) {
  //     await ctx.reply('❌ Расписание не найдено');
  //     return;
  //   }

  //   // Загружаем существующие данные в сессию
  //   ctx.session = {
  //     selectedDays: existingSchedule.daysOfWeek,
  //     selectedTimes: existingSchedule.times,
  //     currentStep: 'days',
  //   };

  //   try {
  //     await ctx.deleteMessage();
  //   } catch (e) {}

  //   await this.showDaysSelection(ctx);
  // }

  // @Action('delete')
  // async onDelete(@Ctx() ctx: Scenes.SceneContext & { update?: { callback_query?: any } }) {
  //   try {
  //     await ctx.answerCbQuery();
  //   } catch (e) {}

  //   const chatId = ctx.update?.callback_query?.message?.chat?.id;

  //   if (!chatId) {
  //     await ctx.reply('Ошибка: не удалось определить chatId');
  //     return;
  //   }

  //   await this.notificationScheduleProvider.delete(chatId);

  //   try {
  //     await ctx.deleteMessage();
  //   } catch (e) {}

  //   await ctx.reply('✅ Расписание удалено');

  //   await ctx.scene.leave();
  //   await ctx.scene.enter('MENU_SCENE_ID');
  // }

  @Action('cancel')
  async onCancel(@Ctx() ctx: Scenes.SceneContext) {
    // try {
    //   await ctx.answerCbQuery();
    // } catch (e) {}

    try {
      await ctx.deleteMessage();
    } catch (e) {}

    await ctx.reply('❌ Отменено');
    await ctx.scene.leave();
    await ctx.scene.enter('MENU_SCENE_ID');
  }
}

