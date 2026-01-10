import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf } from 'telegraf';
import { LoggerProvider } from '../logger-module/logger.provider';

const NOTIFICATION_MESSAGES = [
  '⏰ Время потренироваться! 10 минут в день — и ты заметишь прогресс! 💪',
  '🎯 Не забывай про практику! Всего 10 минут занятий помогут улучшить твои навыки. 🌟',
  '📚 Пора заняться языком! Регулярные упражнения — ключ к успеху. Удели 10 минут в день! ✨',
  '💡 Напоминание: 10 минут тренировки сегодня = заметный прогресс завтра! Начни сейчас! 🚀',
  '🔥 Каждый день — новая возможность улучшить свои навыки! Выдели 10 минут на упражнения. 💫',
];

@Injectable()
export class NotificationSenderService implements OnModuleInit {
  private bot: Telegraf;

  constructor(
    private configService: ConfigService,
    private logger: LoggerProvider,
  ) {}

  onModuleInit() {
    const token = this.configService.get<string>('telegram.botAccessToken');
    if (!token) {
      this.logger.error('Telegram bot token is not configured');
      return;
    }
    this.bot = new Telegraf(token);
  }

  async sendNotification(chatId: number): Promise<boolean> {
    if (!this.bot) {
      this.logger.error('Bot is not initialized, cannot send notification');
      return false;
    }

    try {
      const message =
        NOTIFICATION_MESSAGES[
          Math.floor(Math.random() * NOTIFICATION_MESSAGES.length)
        ];

      await this.bot.telegram.sendMessage(chatId, message);

      this.logger.log(
        `Notification sent to chatId: ${chatId}`,
      );

      return true;
    } catch (error: any) {
      this.logger.error(
        `Failed to send notification to chatId ${chatId}: ${error?.message || error}`,
      );

      // Если пользователь заблокировал бота или произошла другая ошибка
      if (
        error?.response?.error_code === 403 ||
        error?.response?.description?.includes('bot was blocked')
      ) {
        this.logger.warn(`User ${chatId} blocked the bot, notification not sent`);
      }

      return false;
    }
  }
}

