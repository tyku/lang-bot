import {
  FilterQuery,
  Model,
  ProjectionType,
  QueryOptions,
  UpdateQuery,
} from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Payment, PaymentDocument } from './payment.model';

@Injectable()
export class PaymentRepository {
  constructor(
    @InjectModel(Payment.name) private model: Model<Payment>,
  ) {}

  find(
    filter: FilterQuery<PaymentDocument> = {},
    projection?: ProjectionType<PaymentDocument>,
    options?: QueryOptions<PaymentDocument>,
  ) {
    return this.model.find<PaymentDocument>(filter, projection, options);
  }

  findOne(
    filter: FilterQuery<PaymentDocument> = {},
    projection?: ProjectionType<PaymentDocument>,
    options?: QueryOptions<PaymentDocument>,
  ) {
    return this.model.findOne<PaymentDocument>(
      filter,
      projection,
      options,
    );
  }

  create(data: Partial<Payment>) {
    return this.model.create(data);
  }

  updateOne(
    filter: FilterQuery<PaymentDocument> = {},
    update: UpdateQuery<PaymentDocument>,
    options?: any,
  ) {
    return this.model.updateOne<PaymentDocument>(filter, update, options);
  }

  findOneAndUpdate(
    filter?: FilterQuery<PaymentDocument>,
    update?: UpdateQuery<PaymentDocument>,
  ) {
    return this.model.findOneAndUpdate(filter, update, {
      new: true,
      upsert: false,
    });
  }
}

