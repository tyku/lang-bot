import { Global, Module } from '@nestjs/common';

import { LoggerProvider } from './logger.provider';

@Global()
@Module({
  providers: [LoggerProvider],
  exports: [LoggerProvider],
})
export class LoggerModule {}
