import { Module } from '@nestjs/common';
import { FluxController } from '../controllers';
import { ArticleService, DeliveryService, FluxService, HooksService, PrismaService } from '../services';

@Module({
  imports: [],
  controllers: [FluxController],
  providers: [FluxService, HooksService, DeliveryService, ArticleService, PrismaService],
})
export class FluxModule {}