import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SupportTicketDocument = HydratedDocument<SupportTicket>;

export interface SupportMessage {
  role: 'user' | 'support';
  text: string;
  createdAt: number;
}

@Schema({ timestamps: true })
export class SupportTicket {
  @Prop({ required: true })
  chatId: number;

  @Prop({ required: true, unique: true })
  ticketNumber: number;

  @Prop({
    type: [
      {
        role: { type: String, enum: ['user', 'support'], required: true },
        text: { type: String, required: true },
        createdAt: { type: Number, required: true },
      },
    ],
    required: true,
    default: [],
  })
  messages: SupportMessage[];

  @Prop({ required: true, enum: ['open', 'answered'], default: 'open' })
  status: 'open' | 'answered';
}

export const SupportTicketSchema = SchemaFactory.createForClass(SupportTicket);
SupportTicketSchema.index({ chatId: 1, createdAt: -1 });
SupportTicketSchema.index({ ticketNumber: 1 }, { unique: true });

