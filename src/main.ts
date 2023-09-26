import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';

import { AllExceptionsFilter } from 'src/exceptionFilters/all.filter';
import { ValidationPipe } from '@nestjs/common';
import { setConfiguration } from './configuration/readFile';

async function bootstrap(): Promise<void> {
  setConfiguration('./configuration.ini');

  const app = await NestFactory.create(AppModule);

  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

  app.useGlobalPipes(new ValidationPipe({
      skipMissingProperties: false,
      whitelist: true,
  }));

  await app.listen(3000);
}
bootstrap();
