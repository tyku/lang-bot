import { session } from 'telegraf';
import { TelegrafModule } from 'nestjs-telegraf';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

import configs from './configs';
import { TelegramModule } from './telegram-module/telegram.module';
import { LoggerModule } from './logger-module/logger.module';
import { ServicesModule } from './services/services.module';
import { NotificationModule } from './notifications-module/notification.module';
import { BullModule } from '@nestjs/bullmq';
import Redis from 'ioredis';

function createRedisStore(redis: Redis, ttl = 86400) {
  return {
    async get(key: string) {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : undefined;
    },
    async set(key: string, value: any) {
      await redis.set(key, JSON.stringify(value), 'EX', ttl);
    },
    async delete(key: string) {
      await redis.del(key);
    },
  };
}

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configs],
      envFilePath: ['.env'],
      isGlobal: true,
    }),
    TelegrafModule.forRootAsync({
      imports: [TelegramModule],
      useFactory: (configService: ConfigService) => {
        const redisHost = configService.get<string>('redis.host')!;
        const redisPort = configService.get<number>('redis.port')!;
        const redisPassword = configService.get<string>('redis.password')!;

        const redis = new Redis({
          host: redisHost || 'localhost',
          port: redisPort,
          password: redisPassword,
        });

        return {
          botName: 'proj-eng',
          token: configService.get<string>('telegram.botAccessToken')!,
          middlewares: [
            // session(),
            session({ store: createRedisStore(redis) }),
            async (ctx, next) => {
              // Обработка /start
              if (ctx.update.message?.text === '/start') {
                if (ctx.scene && typeof ctx.scene.leave === 'function') {
                  await ctx.scene.leave();
                }
                if (ctx.session && ctx.session.__scenes) {
                  delete ctx.session.__scenes;
                }
              }
              
              try {
                return await next();
              } catch (error: any) {
                // Обработка устаревших callback_query (после перезапуска бота)
                const errorMessage = error?.response?.description || error?.message || String(error);
                const isCallbackQueryError = 
                  ctx.update?.callback_query &&
                  (errorMessage.includes('query is too old') ||
                    errorMessage.includes('query ID is invalid') ||
                    errorMessage.includes('QUERY_ID_INVALID') ||
                    errorMessage.includes('Bad Request: query'));
                
                if (isCallbackQueryError) {
                  try {
                    // Отвечаем на устаревший callback_query, чтобы убрать "часики"
                    await ctx.answerCbQuery('⚠️ Эта кнопка больше не активна. Используйте /start или меню 📱️');
                  } catch (e) {
                    // Игнорируем ошибки ответа на callback_query (например, если уже ответили)
                  }
                  return; // Не пробрасываем ошибку дальше
                }
                
                // Пробрасываем другие ошибки дальше
                throw error;
              }
            },
          ],
          include: [TelegramModule],
        };
      },
      inject: [ConfigService],
    }),
    MongooseModule.forRootAsync({
      imports: [],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('mongo.connectionString'),
      }),
      inject: [ConfigService],
    }),
    // BullModule.forRootAsync({
    //   inject: [ConfigService],
    //   useFactory: (configService: ConfigService) => ({
    //     connection: {
    //       host: configService.get<string>('redis.host') || 'localhost',
    //       port: configService.get<number>('redis.port') || 6379,
    //       password: configService.get<string>('redis.password'),
    //     },
    //   }),
    // }),
    ServicesModule,
    LoggerModule,
    NotificationModule,
  ],
  controllers: [],
  providers: [],
})
export class RootModel {}
