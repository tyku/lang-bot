import { NestFactory } from '@nestjs/core';

import { RootModel } from './root.module';

async function bootstrap() {
  const app = await NestFactory.create(RootModel);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
