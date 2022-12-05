import { Module } from '@nestjs/common';
import { DeliveriesController } from '../controllers';
import { DeliveryService, PrismaService } from '../services';

@Module({
  imports: [],
  controllers: [DeliveriesController],
  providers: [DeliveryService, PrismaService],
})
export class DeliveriesModule {}