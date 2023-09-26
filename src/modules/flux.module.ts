import { Module } from '@nestjs/common';
import { FluxController } from '../controllers';
import { ArticleService, DeliveryService, FluxService, BindingService, PrismaService } from '../services';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [],
  controllers: [FluxController],
  providers: [FluxService, BindingService, DeliveryService, ArticleService, PrismaService, JwtService],
})
export class FluxModule {}