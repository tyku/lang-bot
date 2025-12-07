import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Payment, PaymentSchema } from './payment.model';
import { PaymentProvider } from './payment.provider';
import { PaymentRepository } from './payment.repository';
import { LoggerModule } from '../logger-module/logger.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
    ]),
  ],
  providers: [PaymentProvider, PaymentRepository],
  exports: [PaymentProvider],
})
export class PaymentModule {}

