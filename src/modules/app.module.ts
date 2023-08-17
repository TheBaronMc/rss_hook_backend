import { Module } from '@nestjs/common';
import { ArticlesModule } from './articles.module';
import { WebhookModule } from './webhook.module';
import { HookModule } from './binding.module';
import { DeliveriesModule } from './deliveries.module';
import { FluxModule } from './flux.module';

@Module({
  imports: [ArticlesModule, WebhookModule, FluxModule, HookModule, DeliveriesModule],
})
export class AppModule {}
