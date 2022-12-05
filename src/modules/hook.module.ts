import { Module } from '@nestjs/common';
import { HooksController } from '../controllers';
import { FluxService, HooksService, PrismaService, WebhooksService } from '../services';

@Module({
  imports: [],
  controllers: [HooksController],
  providers: [HooksService, FluxService, WebhooksService, PrismaService],
})
export class HookModule {}