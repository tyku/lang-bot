import { FilterQuery, Model, ProjectionType, QueryOptions, UpdateQuery, mongo } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { SupportTicket, SupportTicketDocument } from './support.model';

@Injectable()
export class SupportRepository {
  constructor(
    @InjectModel(SupportTicket.name) private model: Model<SupportTicket>,
  ) {}

  findOne(
    filter: FilterQuery<SupportTicketDocument> = {},
    projection?: ProjectionType<SupportTicketDocument>,
    options?: QueryOptions<SupportTicketDocument>,
  ) {
    return this.model.findOne<SupportTicketDocument>(
      filter,
      projection,
      options,
    );
  }

  create(data: Partial<SupportTicket>) {
    return this.model.create(data);
  }

  findOneAndUpdate(
    filter: FilterQuery<SupportTicketDocument>,
    update: UpdateQuery<SupportTicketDocument>,
    options?: QueryOptions<SupportTicketDocument>,
  ) {
    return this.model.findOneAndUpdate(filter, update, {
      new: true,
      upsert: true,
      ...options,
    });
  }

  updateOne(
    filter: FilterQuery<SupportTicketDocument>,
    update: UpdateQuery<SupportTicketDocument>,
  ) {
    return this.model.updateOne(filter, update);
  }

  deleteOne(filter: FilterQuery<SupportTicketDocument>): Promise<mongo.DeleteResult> {
    return this.model.deleteOne(filter);
  }

  find(
    filter: FilterQuery<SupportTicketDocument> = {},
    projection?: ProjectionType<SupportTicketDocument>,
    options?: QueryOptions<SupportTicketDocument>,
  ) {
    return this.model.find<SupportTicketDocument>(filter, projection, options);
  }
}

