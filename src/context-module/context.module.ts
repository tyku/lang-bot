import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Context, ContextSchema } from './context.model';
import { ContextProvider } from './context.provider';
import { ContextRepository } from './context.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Context.name, schema: ContextSchema }]),
  ],
  providers: [ContextRepository, ContextProvider],
  exports: [ContextProvider],
})
export class ContextModule {}
