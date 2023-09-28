import { Module } from '@nestjs/common';
import { WebhookController } from '../controllers';
import { DeliveryService, BindingService, PrismaService, WebhooksService } from '../services';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [],
  controllers: [WebhookController],
  providers: [WebhooksService, BindingService, DeliveryService, PrismaService, JwtService],
})
export class WebhookModule {}