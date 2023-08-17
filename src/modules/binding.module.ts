import { Module } from '@nestjs/common';
import { BindingsController } from '../controllers';
import { FluxService, BindingService, PrismaService, WebhooksService } from '../services';

@Module({
  imports: [],
  controllers: [BindingsController],
  providers: [BindingsController, BindingService, FluxService, WebhooksService, PrismaService],
})
export class BindingModule {}