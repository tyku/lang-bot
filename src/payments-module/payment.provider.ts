import { Injectable } from '@nestjs/common';
import { PaymentRepository } from './payment.repository';
import { LoggerProvider } from '../logger-module/logger.provider';
import { EPaymentProvider, EPaymentStatus } from './constants/types';

export type TCreatePayment = {
  chatId: number;
  provider: EPaymentProvider;
  amount: number;
  price: number;
  tariffId: string;
  externalPaymentId?: string;
  metadata?: Record<string, any>;
};

export type TUpdatePaymentStatus = {
  status: EPaymentStatus;
  externalPaymentId?: string;
  metadata?: Record<string, any>;
};

@Injectable()
export class PaymentProvider {
  constructor(
    private paymentRepo: PaymentRepository,
    private logger: LoggerProvider,
  ) {}

  async create(data: TCreatePayment) {
    try {
      const payment = await this.paymentRepo.create({
        chatId: data.chatId,
        provider: data.provider,
        status: EPaymentStatus.PENDING,
        amount: data.amount,
        price: data.price,
        tariffId: data.tariffId,
        externalPaymentId: data.externalPaymentId,
        metadata: data.metadata,
      });

      this.logger.log(
        `Payment created: id=${payment._id}, chatId=${data.chatId}, provider=${data.provider}, amount=${data.amount}`,
      );

      return payment;
    } catch (e) {
      this.logger.error(
        `${this.constructor.name} create: something went wrong (error=${e})`,
      );
      throw e;
    }
  }

  async updateStatus(
    paymentId: string,
    data: TUpdatePaymentStatus,
  ) {
    try {
      const update: any = {
        status: data.status,
      };

      if (data.externalPaymentId) {
        update.externalPaymentId = data.externalPaymentId;
      }

      if (data.metadata) {
        update.metadata = data.metadata;
      }

      const payment = await this.paymentRepo.findOneAndUpdate(
        { _id: paymentId },
        { $set: update },
      );

      if (!payment) {
        this.logger.error(
          `${this.constructor.name} updateStatus: payment not found (id=${paymentId})`,
        );
        return null;
      }

      this.logger.log(
        `Payment status updated: id=${paymentId}, status=${data.status}`,
      );

      return payment;
    } catch (e) {
      this.logger.error(
        `${this.constructor.name} updateStatus: something went wrong (error=${e})`,
      );
      throw e;
    }
  }

  async updateStatusByExternalId(
    externalPaymentId: string,
    provider: EPaymentProvider,
    data: TUpdatePaymentStatus,
  ) {
    try {
      const update: any = {
        status: data.status,
      };

      if (data.metadata) {
        update.metadata = data.metadata;
      }

      const payment = await this.paymentRepo.findOneAndUpdate(
        { externalPaymentId, provider },
        { $set: update },
      );

      if (!payment) {
        this.logger.error(
          `${this.constructor.name} updateStatusByExternalId: payment not found (externalPaymentId=${externalPaymentId}, provider=${provider})`,
        );
        return null;
      }

      this.logger.log(
        `Payment status updated by externalId: externalPaymentId=${externalPaymentId}, status=${data.status}`,
      );

      return payment;
    } catch (e) {
      this.logger.error(
        `${this.constructor.name} updateStatusByExternalId: something went wrong (error=${e})`,
      );
      throw e;
    }
  }

  async findById(paymentId: string) {
    try {
      return await this.paymentRepo
        .findOne({ _id: paymentId })
        .lean()
        .exec();
    } catch (e) {
      this.logger.error(
        `${this.constructor.name} findById: something went wrong (error=${e})`,
      );
      return null;
    }
  }

  async findByExternalId(
    externalPaymentId: string,
    provider: EPaymentProvider,
  ) {
    try {
      return await this.paymentRepo
        .findOne({ externalPaymentId, provider })
        .lean()
        .exec();
    } catch (e) {
      this.logger.error(
        `${this.constructor.name} findByExternalId: something went wrong (error=${e})`,
      );
      return null;
    }
  }

  async findByChatId(chatId: number, limit: number = 10) {
    try {
      return await this.paymentRepo
        .find({ chatId }, undefined, { limit, sort: { createdAt: -1 } })
        .lean()
        .exec();
    } catch (e) {
      this.logger.error(
        `${this.constructor.name} findByChatId: something went wrong (error=${e})`,
      );
      return [];
    }
  }
}

