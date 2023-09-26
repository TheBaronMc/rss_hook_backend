import { Module } from '@nestjs/common';
import { BindingsController } from '../controllers';
import { FluxService, BindingService, PrismaService, WebhooksService } from '../services';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [],
  controllers: [BindingsController],
  providers: [BindingsController, BindingService, FluxService, WebhooksService, PrismaService, JwtService],
})
export class BindingModule {}