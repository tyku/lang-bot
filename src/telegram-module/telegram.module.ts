import { Module } from '@nestjs/common';

import { TelegramUpdate } from './telegram.update';
// import { SubscriptionProvider } from './scenes/subscription.provider';
import { TrainerProvider } from './scenes/trainer.provider';
import { NewUserProvider } from './scenes/new-user.provider';
import { UserModule } from '../user-module/user.module';
import { ContextModule } from '../context-module/context.module';
import { ChatModule } from '../chat-module/chat.module';
import { MenuProvider } from './scenes/menu.provider';
import { ExercisesModule } from '../exercises-module/exercises.module';
import { PromocodeProvider } from './scenes/promocode.provider';
import { SubscriptionModule } from '../subscription-module/subscription.module';
import { PromoModule } from '../promo-module/promo.module';
import { PaymentProvider } from './scenes/payment.provider';
import { MessageCleanerService } from './message-cleaner.service';
import { PaymentModule } from 'src/payments-module/payment.module';
import { FeedbackModule } from '../feedback-module/feedback.module';
import { MessageStorageModule } from '../message-storage-module/message-storage.module';
import { SupportModule } from '../support-module/support.module';
import { SupportSceneProvider } from './scenes/support.provider';

@Module({
  imports: [
    UserModule,
    ContextModule,
    ChatModule,
    PromoModule,
    ExercisesModule,
    SubscriptionModule,
    PaymentModule,
    FeedbackModule,
    MessageStorageModule,
    SupportModule,
  ],
  providers: [
    MenuProvider,
    TelegramUpdate,
    NewUserProvider,
    TrainerProvider,
    // SubscriptionProvider,
    PaymentProvider,
    PromocodeProvider,
    MessageCleanerService,
    SupportSceneProvider,
  ],
})
export class TelegramModule {}
