import { Injectable } from '@nestjs/common';
import { MessageStorageRepository } from './message-storage.repository';
import { MessageType } from './message-storage.model';

@Injectable()
export class MessageStorageProvider {
  constructor(
    private messageStorageRepo: MessageStorageRepository,
  ) {}

  /**
   * Сохранить сообщение
   */
  async saveMessage(
    chatId: number | null,
    messageId: number,
    type: MessageType,
  ): Promise<void> {
    try {
        if (!chatId) {
            return;
        }

      await this.messageStorageRepo.create(chatId, messageId, type);
    } catch (error) {
      // Игнорируем ошибку дубликата, если сообщение уже сохранено
      if ((error as any).code !== 11000) {
        throw error;
      }
    }
  }

  /**
   * Удалить сообщения по типу для конкретного чата
   */
  async deleteMessagesByType(
    chatId: number | null,
    type: MessageType,
  ): Promise<void> {
    if (!chatId) {
        return;
    }

    await this.messageStorageRepo.deleteMany({ chatId, type });
  }

  /**
   * Удалить все сообщения для конкретного чата
   */
  async deleteAllMessages(chatId: number): Promise<void> {
    await this.messageStorageRepo.deleteMany({ chatId });
  }

  /**
   * Удалить конкретное сообщение
   */
  async deleteMessage(chatId: number, messageId: number): Promise<void> {
    await this.messageStorageRepo.deleteMany({ chatId, messageId });
  }

  /**
   * Получить все сообщения определенного типа для чата
   */
  async getMessagesByType(
    chatId: number | null,
    type: MessageType,
  ): Promise<Array<{ messageId: number; chatId: number; type: MessageType }>> {
    if (!chatId) {
        return [];
    }

    const messages = await this.messageStorageRepo
      .find({ chatId, type, isActive: true })
      .lean()
      .exec();

    return messages.map((msg) => ({
      messageId: msg.messageId,
      chatId: msg.chatId,
      type: msg.type,
    }));
  }

  /**
   * Получить все сообщения для чата
   */
  async getAllMessages(
    chatId: number,
  ): Promise<Array<{ messageId: number; chatId: number; type: MessageType }>> {
    const messages = await this.messageStorageRepo
      .find({ chatId, isActive: true })
      .lean()
      .exec();

    return messages.map((msg) => ({
      messageId: msg.messageId,
      chatId: msg.chatId,
      type: msg.type,
    }));
  }

  /**
   * Пометить сообщения как неактивные (мягкое удаление)
   */
  async deactivateMessagesByType(
    chatId: number,
    type: MessageType,
  ): Promise<void> {
    await this.messageStorageRepo.updateMany(
      { chatId, type, isActive: true },
      { isActive: false },
    );
  }

  /**
   * Пометить все сообщения как неактивные (мягкое удаление)
   */
  async deactivateAllMessages(chatId: number): Promise<void> {
    await this.messageStorageRepo.updateMany(
      { chatId, isActive: true },
      { isActive: false },
    );
  }

  async getLastMessageByType(
    chatId: number | null,
    type: MessageType,
  ): Promise<{ messageId: number; chatId: number; type: MessageType } | null> {
    if (!chatId) {
      return null;
    }

    const message = await this.messageStorageRepo.findOne({ chatId, type, isActive: true }).sort({ createdAt: -1 }).lean().exec();

    return message ? { messageId: message.messageId, chatId: message.chatId, type: message.type } : null;
  }

  async getAllMessageByType(
    chatId: number | null,
    type: MessageType,
  ): Promise<Array<{ messageId: number; chatId: number; type: MessageType }>> {
    if (!chatId) {
      return [];
    }

    const messages = await this.messageStorageRepo
      .find({ chatId, type, isActive: true })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return messages.map((msg) => ({
      messageId: msg.messageId,
      chatId: msg.chatId,
      type: msg.type,
    }));
  }

  /**
   * Получить messageIds сообщений определенного типа для батчинга удалений
   */
  async getMessageIdsByType(
    chatId: number | null,
    type: MessageType,
  ): Promise<number[]> {
    if (!chatId) {
      return [];
    }

    const messages = await this.messageStorageRepo
      .find({ chatId, type, isActive: true }, { messageId: 1 })
      .lean()
      .exec();

    return messages.map((msg) => msg.messageId);
  }

  /**
   * Удалить сообщения по списку messageIds (оптимизированное удаление)
   */
  async deleteMessagesByIds(
    chatId: number | null,
    messageIds: number[],
  ): Promise<void> {
    if (!chatId || !messageIds.length) {
      return;
    }

    await this.messageStorageRepo.deleteMany({
      chatId,
      messageId: { $in: messageIds },
    });
  }
}

