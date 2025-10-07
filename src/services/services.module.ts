import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import * as providers from './providers';

const DEFAULT_SERVICE_TIMEOUT = 10000;
const DEFAULT_SERVICE_REDIRECTS = 5;

@Global()
@Module({
  imports: [
    HttpModule.register({
      timeout: DEFAULT_SERVICE_TIMEOUT,
      maxRedirects: DEFAULT_SERVICE_REDIRECTS,
    }),
  ],
  providers: [...Object.values(providers)],
  exports: [...Object.values(providers)],
})
export class ServicesModule {}
