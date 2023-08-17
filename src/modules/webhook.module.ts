import { Module } from '@nestjs/common';
import { WebhookController } from '../controllers';
import { DeliveryService, BindingService, PrismaService, WebhooksService } from '../services';

@Module({
  imports: [],
  controllers: [WebhookController],
  providers: [WebhooksService, BindingService, DeliveryService, PrismaService],
})
export class WebhookModule {}