import { Injectable } from '@nestjs/common';
import { SupportRepository } from './support.repository';
import { SupportMessage } from './support.model';

@Injectable()
export class SupportProvider {
  private pendingNewMessage: Map<number, string> = new Map();

  constructor(private supportRepo: SupportRepository) {}

  async getTicket(chatId: number) {
    return this.supportRepo
      .findOne({ chatId }, {}, { sort: { createdAt: -1 } })
      .lean()
      .exec();
  }

  async getNextTicketNumber(): Promise<number> {
    const lastTicket = await this.supportRepo
      .findOne({}, { ticketNumber: 1 })
      .sort({ ticketNumber: -1 })
      .lean()
      .exec();

    return lastTicket?.ticketNumber ? lastTicket.ticketNumber + 1 : 1;
  }

  async createTicket(chatId: number, firstMessage: string) {
    const ticketNumber = await this.getNextTicketNumber();

    const ticket = await this.supportRepo.create({
      chatId,
      ticketNumber,
      messages: [
        {
          role: 'user',
          text: firstMessage,
          createdAt: Date.now(),
        },
      ],
      status: 'open',
    });

    return ticket.toObject();
  }

  async addMessage(chatId: number, message: string): Promise<void> {
    const ticket = await this.getTicket(chatId);
    if (!ticket) {
      return;
    }

    const newMessage: SupportMessage = {
      role: 'user',
      text: message,
      createdAt: Date.now(),
    };

    const update: any = {
      $push: { messages: newMessage },
    };

    if (ticket.status === 'answered') {
      update.$set = { status: 'open' };
    }

    await this.supportRepo.updateOne({ _id: ticket._id }, update);
  }

  setPendingMessage(chatId: number, message: string): void {
    this.pendingNewMessage.set(chatId, message);
  }

  getPendingMessage(chatId: number): string | undefined {
    return this.pendingNewMessage.get(chatId);
  }

  clearPendingMessage(chatId: number): void {
    this.pendingNewMessage.delete(chatId);
  }

  async deleteTicket(chatId: number): Promise<void> {
    await this.supportRepo.deleteOne({ chatId });
  }

  async getTicketSummary(chatId: number): Promise<{
    ticketNumber: number;
    firstMessage: string;
    allUserMessages: string[];
    status: 'open' | 'answered';
    lastSupportResponse: string | null;
  } | null> {
    const ticket = await this.getTicket(chatId);
    if (!ticket) {
      return null;
    }

    const firstUserMessage = ticket.messages.find((m) => m.role === 'user');
    const userMessages = ticket.messages.filter((m) => m.role === 'user');
    const supportMessages = ticket.messages.filter((m) => m.role === 'support');
    const lastSupportMessage = supportMessages[supportMessages.length - 1];

    return {
      ticketNumber: ticket.ticketNumber,
      firstMessage: firstUserMessage?.text || '',
      allUserMessages: userMessages.map((m) => m.text),
      status: ticket.status,
      lastSupportResponse: lastSupportMessage?.text || null,
    };
  }
}

