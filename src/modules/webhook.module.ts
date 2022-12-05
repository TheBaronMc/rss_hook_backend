import { Module } from '@nestjs/common';
import { WebhookController } from '../controllers';
import { DeliveryService, HooksService, PrismaService, WebhooksService } from '../services';

@Module({
  imports: [],
  controllers: [WebhookController],
  providers: [WebhooksService, HooksService, DeliveryService, PrismaService],
})
export class WebhookModule {}