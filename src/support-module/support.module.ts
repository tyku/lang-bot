import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SupportProvider } from './support.provider';
import { SupportRepository } from './support.repository';
import { SupportTicket, SupportTicketSchema } from './support.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SupportTicket.name, schema: SupportTicketSchema },
    ]),
  ],
  providers: [SupportRepository, SupportProvider],
  exports: [SupportProvider],
})
export class SupportModule {}

