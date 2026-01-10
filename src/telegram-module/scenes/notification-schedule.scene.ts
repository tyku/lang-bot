import {
  Action,
  Ctx,
  Next,
  On,
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
import { UserProvider } from '../../user-module/user.provider';

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
  schedule: {
    selectedDays?: DayOfWeek[];
    selectedTimes?: ScheduleTime[];
    currentStep?: 'days' | 'hours' | 'minutes' | 'confirm' | 'timezone';
    timeIndex?: number;
    selectingHour?: boolean;
  }
};

// Популярные часовые пояса России
const COMMON_TIMEZONES = [
  { tz: 'Europe/Kaliningrad', name: 'Калининград (UTC+2)' },
  { tz: 'Europe/Moscow', name: 'Москва (UTC+3)' },
  { tz: 'Europe/Samara', name: 'Самара (UTC+4)' },
  { tz: 'Asia/Yekaterinburg', name: 'Екатеринбург (UTC+5)' },
  { tz: 'Asia/Omsk', name: 'Омск (UTC+6)' },
  { tz: 'Asia/Krasnoyarsk', name: 'Красноярск (UTC+7)' },
  { tz: 'Asia/Irkutsk', name: 'Иркутск (UTC+8)' },
  { tz: 'Asia/Chita', name: 'Чита (UTC+9)' },
  { tz: 'Asia/Vladivostok', name: 'Владивосток (UTC+10)' },
  { tz: 'Asia/Magadan', name: 'Магадан (UTC+11)' },
  { tz: 'Asia/Kamchatka', name: 'Камчатка (UTC+12)' },
];

@Scene('NOTIFICATION_SCHEDULE_SCENE_ID')
export class NotificationScheduleSceneProvider {
  constructor(
    private notificationScheduleProvider: NotificationScheduleProvider,
    private userProvider: UserProvider,
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
    const existingSchedule = await this.notificationScheduleProvider.findByChatId(
      chatId,
    );

    // Получаем пользователя для отображения часового пояса
    const user = await this.userProvider.findByChatId(chatId);
    const timezone = user?.timezone || 'Europe/Moscow';
    const timezoneName = COMMON_TIMEZONES.find(t => t.tz === timezone)?.name || timezone;

    if (existingSchedule) {
      const daysText = existingSchedule.daysOfWeek
        .map((d) => DAY_NAMES[d])
        .join(', ');
      const timesText = existingSchedule.times
        .map((t) => `${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}`)
        .join(', ');

      const statusText = existingSchedule.isActive ? '✅ Включено' : '❌ Выключено';

      await ctx.reply(
        `📅 Текущее расписание:\n\n` +
        `Дни: ${daysText}\n` +
        `Время: ${timesText}\n` +
        `Часовой пояс: ${timezoneName}\n` +
        `Статус: ${statusText}\n\n` +
        `Что вы хотите сделать?`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '✏️ Изменить', callback_data: 'edit' },
                { text: existingSchedule.isActive ? '⏸ Выключить' : '▶️ Включить', callback_data: 'toggle' },
              ],
              [{ text: '🌍 Изменить часовой пояс', callback_data: 'change_timezone' }],
              [{ text: '🗑 Удалить', callback_data: 'delete' }],
              [{ text: '❌ Отмена', callback_data: 'cancel' }],
            ],
          },
        },
      );
      return;
    }

    // Проверяем, нужно ли сначала выбрать часовой пояс
    // Если у пользователя дефолтный часовой пояс, предлагаем выбрать свой
    if (!user || timezone === 'Europe/Moscow') {
      // Предлагаем выбрать часовой пояс перед настройкой расписания
      await ctx.reply(
        `🌍 Перед настройкой напоминаний, пожалуйста, выберите ваш часовой пояс:\n\n` +
        `Это нужно, чтобы напоминания приходили в правильное время в вашем регионе.`,
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: '✅ Выбрать часовой пояс', callback_data: 'setup_timezone' }],
              [{ text: '⏭ Пропустить (Москва, UTC+3)', callback_data: 'skip_timezone_setup' }],
              [{ text: '❌ Отмена', callback_data: 'cancel' }],
            ],
          },
        },
      );
      return;
    }

    // Инициализируем новое расписание
    ctx.session.schedule = {
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
    const selectedDays = session.schedule.selectedDays || [];

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
    for (let i = 0; i < allDays.length; i += 2) {
      const day1 = allDays[i];
      const day2 = allDays[i + 1];
      const row: InlineKeyboardButton[] = [];

      const day1Text = selectedDays.includes(day1) ? `✅ ${DAY_NAMES[day1]}` : DAY_NAMES[day1];
      row.push({ text: day1Text, callback_data: `day:${day1}` });

      if (day2 !== undefined) {
        const day2Text = selectedDays.includes(day2) ? `✅ ${DAY_NAMES[day2]}` : DAY_NAMES[day2];
        row.push({ text: day2Text, callback_data: `day:${day2}` });
      }

      buttons.push(row);
    }

    buttons.push([
      { text: '✅ Готово', callback_data: 'notification_days_ready' },
      { text: '❌ Отмена', callback_data: 'notification_days_cancel' },
    ]);

    await ctx.replyWithMarkdownV2(escapeText('📅 Выберите дни недели для напоминаний:'), {
      reply_markup: {
        inline_keyboard: buttons,
      },
    });
  }

  @On('callback_query')
  async onCallbackQuery(
    @Ctx() ctx: Scenes.SceneContext & { session?: TSession; update?: { callback_query?: any } },
    @Next() next: () => Promise<void>,
  ) {
    const callbackData = ctx.update?.callback_query?.data;
    
    if (!callbackData) {
      return next();
    }

    try {
      await ctx.answerCbQuery();
    } catch (e) {}

    // Обрабатываем все действия в одном месте
    if (callbackData.startsWith('day:')) {
      const day = Number(callbackData.split(':')[1]) as DayOfWeek;
      const session = ctx.session || { selectedDays: [] };
      const selectedDays = session.schedule.selectedDays || [];

      if (selectedDays.includes(day)) {
        session.schedule.selectedDays = selectedDays.filter((d) => d !== day);
      } else {
        session.schedule.selectedDays = [...selectedDays, day];
      }

      ctx.session = session;

      try {
        await ctx.deleteMessage();
      } catch (e) {}

      await this.showDaysSelection(ctx);
      return;
    }

    if (callbackData.startsWith('hour:')) {
      const hour = Number(callbackData.split(':')[1]);
      const session = ctx.session || {};
      const selectedTimes = session.schedule.selectedTimes || [];
      const timeIndex = session.schedule.timeIndex || 0;

      if (!selectedTimes[timeIndex]) {
        selectedTimes[timeIndex] = { hour, minute: 0 };
      } else {
        selectedTimes[timeIndex].hour = hour;
      }

      session.schedule.selectedTimes = selectedTimes;
      session.schedule.selectingHour = false;
      ctx.session = { ...ctx.session, schedule: session.schedule };

      try {
        await ctx.deleteMessage();
      } catch (e) {}

      await this.showMinuteSelection(ctx);
      return;
    }

    if (callbackData.startsWith('minute:')) {
      const minute = Number(callbackData.split(':')[1]);
      const session = ctx.session || {};
      const selectedTimes = session.schedule.selectedTimes || [];
      const timeIndex = session.schedule.timeIndex || 0;

      // Проверяем, что час уже выбран
      if (!selectedTimes[timeIndex] || selectedTimes[timeIndex].hour === undefined) {
        await ctx.reply('❌ Сначала выберите час, затем минуты');
        return;
      }

      selectedTimes[timeIndex].minute = minute;
      session.schedule.selectedTimes = selectedTimes;
      session.schedule.timeIndex = (timeIndex || 0) + 1;
      ctx.session = { ...ctx.session, schedule: session.schedule };

      try {
        await ctx.deleteMessage();
      } catch (e) {}

      if (selectedTimes.length >= 3 || session.schedule.timeIndex >= 3) {
        await this.showConfirmation(ctx);
      } else {
        await ctx.reply(
          `✅ Время ${selectedTimes.length} добавлено!\n\n` +
          `Хотите добавить еще одно время? (максимум 3)`,
          {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '➕ Добавить еще', callback_data: 'add_time' },
                  { text: '✅ Готово', callback_data: 'times_done' },
                ],
                [{ text: '❌ Отмена', callback_data: 'cancel' }],
              ],
            },
          },
        );
      }
      return;
    }

    if (callbackData.startsWith('timezone:')) {
      const isSetup = callbackData.endsWith(':setup');
      const selectedTimezone = isSetup 
        ? callbackData.replace('timezone:', '').replace(':setup', '')
        : callbackData.replace('timezone:', '');
      const chatId = ctx.update?.callback_query?.message?.chat?.id;

      if (!chatId) {
        await ctx.reply('Ошибка: не удалось определить chatId');
        return;
      }

      await this.userProvider.updateTimezone(chatId, selectedTimezone);
      const timezoneName = COMMON_TIMEZONES.find(t => t.tz === selectedTimezone)?.name || selectedTimezone;

      try {
        await ctx.deleteMessage();
      } catch (e) {}

      if (isSetup) {
        // Если это первичная настройка, продолжаем создание расписания
        await ctx.reply(`✅ Часовой пояс установлен: ${timezoneName}\n\nТеперь давайте настроим расписание напоминаний.`);
        
        ctx.session.schedule = {
          selectedDays: [],
          selectedTimes: [],
          currentStep: 'days',
        };

        await this.showDaysSelection(ctx);
      } else {
        // Если это изменение существующего часового пояса, возвращаемся к началу сцены
        await ctx.reply(`✅ Часовой пояс изменен на: ${timezoneName}`);
        await ctx.scene.enter('NOTIFICATION_SCHEDULE_SCENE_ID');
      }
      return;
    }

    // Для остальных действий вызываем next, чтобы они обработались через @Action
    return next();
  }

  @Action('notification_days_ready')
  async onDaysDone(@Ctx() ctx: Scenes.SceneContext & { session?: TSession }) {
    try {
      await ctx.answerCbQuery();
    } catch (e) {}

    const session = ctx.session || {};
    const selectedDays = session.schedule.selectedDays || [];

    if (selectedDays.length === 0) {
      await ctx.reply('❌ Пожалуйста, выберите хотя бы один день');
      return;
    }

    session.schedule.currentStep = 'hours';
    session.schedule.selectedTimes = [];
    session.schedule.timeIndex = 0;
    ctx.session = { ...ctx.session, schedule: session.schedule };

    try {
      await ctx.deleteMessage();
    } catch (e) {}

    await this.showTimeSelection(ctx);
  }

  private async showTimeSelection(
    ctx: Scenes.SceneContext & { session?: TSession },
  ) {
    const session = ctx.session || {};
    const selectedTimes = session.schedule.selectedTimes || [];
    const timeIndex = session.schedule.timeIndex || 0;

    if (selectedTimes.length >= 3) {
      await this.showConfirmation(ctx);
      return;
    }

    const currentTime = selectedTimes[timeIndex];
    const selectedHour = currentTime?.hour;

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
                const text = selectedHour !== undefined && hour === selectedHour ? `✅ ${hour}` : String(hour);
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
    const selectedTimes = session.schedule.selectedTimes || [];
    const timeIndex = session.schedule.timeIndex || 0;
    const currentTime = selectedTimes[timeIndex];

    // Проверяем, что час выбран
    if (!currentTime || currentTime.hour === undefined) {
      await ctx.reply('❌ Сначала нужно выбрать час');
      await this.showTimeSelection(ctx);
      return;
    }

    const selectedMinute = currentTime.minute;

    await ctx.reply(
      `⏰ Напоминание ${timeIndex + 1} из 3\n` +
      `Час: ${currentTime.hour}\n` +
      `Выберите минуты (кратно 15):`,
      {
        reply_markup: {
          inline_keyboard: [
            MINUTE_OPTIONS.map((minute) => ({
              text:
                selectedMinute !== undefined && minute === selectedMinute
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


  @Action('add_time')
  async onAddTime(@Ctx() ctx: Scenes.SceneContext & { session?: TSession }) {
    try {
      await ctx.answerCbQuery();
    } catch (e) {}

    try {
      await ctx.deleteMessage();
    } catch (e) {}

    await this.showTimeSelection(ctx);
  }

  @Action('times_done')
  async onTimesDone(@Ctx() ctx: Scenes.SceneContext & { session?: TSession }) {
    try {
      await ctx.answerCbQuery();
    } catch (e) {}

    const session = ctx.session || {};
    const selectedTimes = session.schedule.selectedTimes || [];

    // Проверяем, что есть хотя бы одно полностью выбранное время (час и минуты)
    const validTimes = selectedTimes.filter(
      (time) => time.hour !== undefined && time.minute !== undefined
    );

    if (validTimes.length === 0) {
      await ctx.reply('❌ Пожалуйста, выберите хотя бы одно полное время (час и минуты)');
      return;
    }

    // Сохраняем только валидные времена
    session.schedule.selectedTimes = validTimes;
    ctx.session = { ...ctx.session, schedule: session.schedule };

    try {
      await ctx.deleteMessage();
    } catch (e) {}

    await this.showConfirmation(ctx);
  }

  private async showConfirmation(
    ctx: Scenes.SceneContext & { session?: TSession },
  ) {
    const session = ctx.session || {};
    const selectedDays = session.schedule.selectedDays || [];
    const selectedTimes = session.schedule.selectedTimes || [];

    // Фильтруем только полностью выбранные времена
    const validTimes = selectedTimes.filter(
      (time) => time.hour !== undefined && time.minute !== undefined
    );

    if (validTimes.length === 0) {
      await ctx.reply('❌ Ошибка: нет полностью выбранного времени. Пожалуйста, выберите хотя бы одно время (час и минуты).');
      await this.showTimeSelection(ctx);
      return;
    }

    const daysText = selectedDays
      .sort((a, b) => a - b)
      .map((d) => DAY_NAMES[d])
      .join(', ');

    const timesText = validTimes
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

  @Action('confirm')
  async onConfirm(@Ctx() ctx: Scenes.SceneContext & { session?: TSession; update?: { callback_query?: any } }) {
    try {
      await ctx.answerCbQuery();
    } catch (e) {}

    const chatId = ctx.update?.callback_query?.message?.chat?.id;

    if (!chatId) {
      await ctx.reply('Ошибка: не удалось определить chatId');
      return;
    }

    const session = ctx.session || {};
    const selectedDays = session.schedule.selectedDays || [];
    const selectedTimes = session.schedule.selectedTimes || [];

    // Фильтруем только полностью выбранные времена (с часом и минутами)
    const validTimes = selectedTimes.filter(
      (time) => time.hour !== undefined && time.minute !== undefined
    );

    if (selectedDays.length === 0 || validTimes.length === 0) {
      await ctx.reply('❌ Ошибка: не заполнены все поля. Убедитесь, что выбраны дни и хотя бы одно полное время (час и минуты).');
      return;
    }

    // Сортируем дни и время
    const sortedDays = [...selectedDays].sort((a, b) => a - b);
    const sortedTimes = [...validTimes].sort((a, b) => {
      if (a.hour !== b.hour) return a.hour - b.hour;
      return a.minute - b.minute;
    });

    try {
      await this.notificationScheduleProvider.createOrUpdate(chatId, {
        chatId,
        daysOfWeek: sortedDays,
        times: sortedTimes,
        isActive: true,
      });

      try {
        await ctx.deleteMessage();
      } catch (e) {}

      await ctx.reply('✅ Расписание успешно сохранено!');

      await ctx.scene.leave();
      await ctx.scene.enter('MENU_SCENE_ID');
    } catch (error: any) {
      await ctx.reply(
        `❌ Ошибка при сохранении расписания: ${error?.message || 'Неизвестная ошибка'}`,
      );
    }
  }

  @Action('toggle')
  async onToggle(@Ctx() ctx: Scenes.SceneContext & { update?: { callback_query?: any } }) {
    try {
      await ctx.answerCbQuery();
    } catch (e) {}

    const chatId = ctx.update?.callback_query?.message?.chat?.id;

    if (!chatId) {
      await ctx.reply('Ошибка: не удалось определить chatId');
      return;
    }

    const existingSchedule =
      await this.notificationScheduleProvider.findByChatId(chatId);

    if (!existingSchedule) {
      await ctx.reply('❌ Расписание не найдено');
      return;
    }

    const newStatus = !existingSchedule.isActive;
    await this.notificationScheduleProvider.updateStatus(chatId, newStatus);

    try {
      await ctx.deleteMessage();
    } catch (e) {}

    await ctx.reply(
      `✅ Напоминания ${newStatus ? 'включены' : 'выключены'}`,
    );

    await ctx.scene.leave();
    await ctx.scene.enter('MENU_SCENE_ID');
  }

  @Action('edit')
  async onEdit(@Ctx() ctx: Scenes.SceneContext & { session?: TSession; update?: { callback_query?: any } }) {
    try {
      await ctx.answerCbQuery();
    } catch (e) {}

    const chatId = ctx.update?.callback_query?.message?.chat?.id;

    if (!chatId) {
      await ctx.reply('Ошибка: не удалось определить chatId');
      return;
    }

    const existingSchedule =
      await this.notificationScheduleProvider.findByChatId(chatId);

    if (!existingSchedule) {
      await ctx.reply('❌ Расписание не найдено');
      return;
    }

    // Загружаем существующие данные в сессию
    ctx.session.schedule = {
      selectedDays: existingSchedule.daysOfWeek,
      selectedTimes: existingSchedule.times,
      currentStep: 'days',
    };

    try {
      await ctx.deleteMessage();
    } catch (e) {}

    await this.showDaysSelection(ctx);
  }

  @Action('delete')
  async onDelete(@Ctx() ctx: Scenes.SceneContext & { update?: { callback_query?: any } }) {
    try {
      await ctx.answerCbQuery();
    } catch (e) {}

    const chatId = ctx.update?.callback_query?.message?.chat?.id;

    if (!chatId) {
      await ctx.reply('Ошибка: не удалось определить chatId');
      return;
    }

    await this.notificationScheduleProvider.delete(chatId);

    try {
      await ctx.deleteMessage();
    } catch (e) {}

    await ctx.reply('✅ Расписание удалено');

    await ctx.scene.leave();
    await ctx.scene.enter('MENU_SCENE_ID');
  }

  @Action('setup_timezone')
  async onSetupTimezone(@Ctx() ctx: Scenes.SceneContext & { update?: { callback_query?: any } }) {
    try {
      await ctx.answerCbQuery();
    } catch (e) {}

    const chatId = ctx.update?.callback_query?.message?.chat?.id;

    if (!chatId) {
      await ctx.reply('Ошибка: не удалось определить chatId');
      return;
    }

    const user = await this.userProvider.findByChatId(chatId);
    const currentTimezone = user?.timezone || 'Europe/Moscow';

    const buttons: InlineKeyboardButton[][] = [];
    
    // Группируем часовые пояса по 2 в ряд
    for (let i = 0; i < COMMON_TIMEZONES.length; i += 2) {
      const row: InlineKeyboardButton[] = [];
      const tz1 = COMMON_TIMEZONES[i];
      const tz2 = COMMON_TIMEZONES[i + 1];

      const tz1Text = currentTimezone === tz1.tz ? `✅ ${tz1.name}` : tz1.name;
      row.push({ text: tz1Text, callback_data: `timezone:${tz1.tz}:setup` });

      if (tz2) {
        const tz2Text = currentTimezone === tz2.tz ? `✅ ${tz2.name}` : tz2.name;
        row.push({ text: tz2Text, callback_data: `timezone:${tz2.tz}:setup` });
      }

      buttons.push(row);
    }

    buttons.push([{ text: '❌ Отмена', callback_data: 'cancel' }]);

    try {
      await ctx.deleteMessage();
    } catch (e) {}

    await ctx.reply('🌍 Выберите ваш часовой пояс:', {
      reply_markup: {
        inline_keyboard: buttons,
      },
    });
  }

  @Action('skip_timezone_setup')
  async onSkipTimezoneSetup(@Ctx() ctx: Scenes.SceneContext & { session?: TSession; update?: { callback_query?: any } }) {
    try {
      await ctx.answerCbQuery();
    } catch (e) {}

    try {
      await ctx.deleteMessage();
    } catch (e) {}

    // Инициализируем новое расписание с дефолтным часовым поясом
    ctx.session.schedule = {
      selectedDays: [],
      selectedTimes: [],
      currentStep: 'days',
    };

    await this.showDaysSelection(ctx);
  }

  @Action('change_timezone')
  async onChangeTimezone(@Ctx() ctx: Scenes.SceneContext & { update?: { callback_query?: any } }) {
    try {
      await ctx.answerCbQuery();
    } catch (e) {}

    const chatId = ctx.update?.callback_query?.message?.chat?.id;

    if (!chatId) {
      await ctx.reply('Ошибка: не удалось определить chatId');
      return;
    }

    const user = await this.userProvider.findByChatId(chatId);
    const currentTimezone = user?.timezone || 'Europe/Moscow';

    const buttons: InlineKeyboardButton[][] = [];
    
    // Группируем часовые пояса по 2 в ряд
    for (let i = 0; i < COMMON_TIMEZONES.length; i += 2) {
      const row: InlineKeyboardButton[] = [];
      const tz1 = COMMON_TIMEZONES[i];
      const tz2 = COMMON_TIMEZONES[i + 1];

      const tz1Text = currentTimezone === tz1.tz ? `✅ ${tz1.name}` : tz1.name;
      row.push({ text: tz1Text, callback_data: `timezone:${tz1.tz}` });

      if (tz2) {
        const tz2Text = currentTimezone === tz2.tz ? `✅ ${tz2.name}` : tz2.name;
        row.push({ text: tz2Text, callback_data: `timezone:${tz2.tz}` });
      }

      buttons.push(row);
    }

    buttons.push([{ text: '❌ Отмена', callback_data: 'cancel' }]);

    try {
      await ctx.deleteMessage();
    } catch (e) {}

    await ctx.reply('🌍 Выберите часовой пояс:', {
      reply_markup: {
        inline_keyboard: buttons,
      },
    });
  }

  @Action(['notification_days_cancel', 'cancel'])
  async onCancel(@Ctx() ctx: Scenes.SceneContext) {
    try {
      await ctx.answerCbQuery();
    } catch (e) {}

    try {
      await ctx.deleteMessage();
    } catch (e) {}

    await ctx.reply('❌ Отменено');
    await ctx.scene.leave();
    await ctx.scene.enter('MENU_SCENE_ID');
  }
}

