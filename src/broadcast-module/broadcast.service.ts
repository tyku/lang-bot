import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf } from 'telegraf';
import { BroadcastProvider } from './broadcast.provider';
import { BroadcastSentProvider } from './broadcast-sent.provider';
import { UserProvider } from '../user-module/user.provider';
import { LoggerProvider } from '../logger-module/logger.provider';
import { escapeText } from 'src/telegram-module/libs/text-format';

@Injectable()
export class BroadcastService implements OnModuleInit {
  private bot: Telegraf;

  constructor(
    private configService: ConfigService,
    private logger: LoggerProvider,
    private broadcastProvider: BroadcastProvider,
    private broadcastSentProvider: BroadcastSentProvider,
    private userProvider: UserProvider,
  ) {}

  onModuleInit() {
    const token = this.configService.get<string>('telegram.botAccessToken');
    if (!token) {
      this.logger.error('Telegram bot token is not configured');
      return;
    }
    this.bot = new Telegraf(token);
  }

  async sendBroadcast(broadcastName: string): Promise<{
    success: number;
    failed: number;
    skipped: number;
    total: number;
  }> {
    if (!this.bot) {
      throw new Error('Bot is not initialized, cannot send broadcast');
    }

    // Получаем рассылку
    const broadcast = await this.broadcastProvider.findByName(broadcastName);
    if (!broadcast) {
      throw new Error(`Broadcast "${broadcastName}" not found`);
    }

    if (!broadcast.isActive) {
      throw new Error(`Broadcast "${broadcastName}" is not active`);
    }

    // Получаем все chatIds пользователей (оптимизация - загружаем только нужные поля)
    const chatIds = await this.userProvider.findAllChatIds();

    this.logger.log(
      `Starting broadcast "${broadcastName}" to ${chatIds.length} users`,
    );

    let success = 0;
    let failed = 0;
    let skipped = 0;
    const total = chatIds.length;

    // Отправляем сообщения батчами для оптимизации
    const batchSize = 50;
    for (let i = 0; i < chatIds.length; i += batchSize) {
      const batch = chatIds.slice(i, i + batchSize);

      // Обрабатываем батч параллельно
      await Promise.all(
        batch.map(async (chatId) => {
          try {
            // Проверяем, была ли уже отправлена рассылка этому пользователю
            const wasSent = await this.broadcastSentProvider.wasSent(
              broadcastName,
              chatId,
            );

            if (wasSent) {
              skipped++;
              this.logger.log(
                `Broadcast "${broadcastName}" already sent to chatId: ${chatId}, skipping`,
              );
              return;
            }

            // Отправляем сообщение
            await this.bot.telegram.sendMessage(chatId, escapeText(broadcast.content), { parse_mode: 'MarkdownV2' });

            // Помечаем как отправленное
            await this.broadcastSentProvider.markAsSent(
              broadcastName,
              chatId,
            );

            success++;
            this.logger.log(
              `Broadcast "${broadcastName}" sent successfully to chatId: ${chatId}`,
            );
          } catch (error: any) {
            failed++;
            const errorMessage = error?.response?.description || error?.message || String(error);

            // Помечаем как отправленное с ошибкой для отслеживания
            await this.broadcastSentProvider.markAsSent(
              broadcastName,
              chatId,
              errorMessage,
            ).catch(() => {
              // Игнорируем ошибки при сохранении записи об ошибке
            });

            // Логируем ошибку
            if (
              error?.response?.error_code === 403 ||
              errorMessage.includes('bot was blocked')
            ) {
              this.logger.warn(
                `User ${chatId} blocked the bot, broadcast "${broadcastName}" not sent`,
              );
            } else {
              this.logger.error(
                `Failed to send broadcast "${broadcastName}" to chatId ${chatId}: ${errorMessage}`,
              );
            }
          }
        }),
      );
    }

    const result = {
      success,
      failed,
      skipped,
      total,
    };

    this.logger.log(
      `Broadcast "${broadcastName}" completed. Success: ${success}, Failed: ${failed}, Skipped: ${skipped}, Total: ${total}`,
    );

    return result;
  }
}

