import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { session } from 'telegraf';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TelegrafModule } from 'nestjs-telegraf';
import { TelegramModule } from './telegram-module/telegram.module';
import configs from './configs';

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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
