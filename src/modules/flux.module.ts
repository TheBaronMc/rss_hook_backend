import { Module } from '@nestjs/common';
import { FluxController } from '../controllers';
import { ArticleService, DeliveryService, FluxService, BindingService, PrismaService } from '../services';

@Module({
  imports: [],
  controllers: [FluxController],
  providers: [FluxService, BindingService, DeliveryService, ArticleService, PrismaService],
})
export class FluxModule {}