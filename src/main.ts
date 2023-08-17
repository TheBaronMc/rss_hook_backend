import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';

import { AllExceptionsFilter } from 'src/exceptionFilters/all.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

  await app.listen(3000);
}
bootstrap();
