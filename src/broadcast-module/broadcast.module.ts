import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BroadcastController } from './broadcast.controller';
import { BroadcastService } from './broadcast.service';
import { BroadcastProvider } from './broadcast.provider';
import { BroadcastSentProvider } from './broadcast-sent.provider';
import { BroadcastRepository } from './broadcast.repository';
import { BroadcastSentRepository } from './broadcast-sent.repository';
import { Broadcast, BroadcastSchema } from './broadcast.model';
import { BroadcastSent, BroadcastSentSchema } from './broadcast-sent.model';
import { BroadcastAuthGuard } from './broadcast-auth.guard';
import { UserModule } from '../user-module/user.module';
import { LoggerModule } from '../logger-module/logger.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Broadcast.name, schema: BroadcastSchema },
      { name: BroadcastSent.name, schema: BroadcastSentSchema },
    ]),
    UserModule,
    LoggerModule,
  ],
  controllers: [BroadcastController],
  providers: [
    BroadcastService,
    BroadcastProvider,
    BroadcastSentProvider,
    BroadcastRepository,
    BroadcastSentRepository,
    BroadcastAuthGuard,
  ],
  exports: [BroadcastProvider, BroadcastSentProvider],
})
export class BroadcastModule {}

