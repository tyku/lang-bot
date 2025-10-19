import { Module } from '@nestjs/common';

import { TelegramUpdate } from './telegram.update';
import { SubscriptionProvider } from './scenes/subscription.provider';
import { TrainerProvider } from './scenes/trainer.provider';
import { NewUserProvider } from './scenes/new-user.provider';
import { UserModule } from '../user-module/user.module';
import { ContextModule } from '../context-module/context.module';
import { ChatModule } from '../chat-module/chat.module';
import { MenuProvider } from './scenes/menu.provider';
import { ExercisesModule } from '../exercises-module/exercises.module';

@Module({
  imports: [UserModule, ContextModule, ChatModule, ExercisesModule],
  providers: [
    MenuProvider,
    TelegramUpdate,
    NewUserProvider,
    TrainerProvider,
    SubscriptionProvider,
  ],
})
export class TelegramModule {}
