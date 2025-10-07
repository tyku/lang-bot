import { session } from 'telegraf';
import { TelegrafModule } from 'nestjs-telegraf';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

import configs from './configs';
import { TelegramModule } from './telegram-module/telegram.module';
import { LoggerModule } from './logger-module/logger.module';
import { ServicesModule } from './services/services.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configs],
      envFilePath: ['.env'],
      isGlobal: true,
    }),
    TelegrafModule.forRootAsync({
      imports: [TelegramModule],
      useFactory: (configService: ConfigService) => ({
        botName: 'proj-eng',
        token: configService.get<string>('telegram.botAccessToken')!,
        middlewares: [session()],
        include: [TelegramModule],
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forRootAsync({
      imports: [],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('mongo.connectionString'),
      }),
      inject: [ConfigService],
    }),
    ServicesModule,
    LoggerModule,
  ],
  controllers: [],
  providers: [],
})
export class RootModel {}
