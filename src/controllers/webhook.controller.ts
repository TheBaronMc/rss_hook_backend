import { Controller, Logger, Delete, Get, HttpException, HttpStatus, Patch, Post, UseFilters, Body, Param, UsePipes, ValidationPipe, UseGuards } from '@nestjs/common';
import { WebhooksService } from '../services/webhooks.service';
import { BindingService } from '../services/bindings.service';
import { DeliveryService } from '../services/deliveries.service';

import { PrismaClientKnownRequestErrorFilter } from '../exceptionFilters/prisma-client-known-request-error.filter';
import { NotFoundErrorFilter } from '../exceptionFilters/not-found-error.filter';

import { CreateWebhookDto, UpdateWebhookDto, DeleteWebhookDto, GetWebhookDto } from '../dataTranferObjects/webhook.dto';

import { Webhooks } from '@prisma/client';
import { AuthGuard } from '../guards/auth/auth.guard';

@Controller('webhooks')
@UseFilters(
    PrismaClientKnownRequestErrorFilter, 
    NotFoundErrorFilter
)
@UsePipes(new ValidationPipe({ transform: true }))
export class WebhookController {
    private readonly logger = new Logger(WebhookController.name);

    constructor(private readonly webhookService: WebhooksService,
        private readonly bindingService: BindingService,
        private readonly deliveryService: DeliveryService) {}

    @UseGuards(AuthGuard)
    @Post()
    async create(@Body() createWebhookDto: CreateWebhookDto): Promise<Webhooks>  {

        try {
            new URL(createWebhookDto.url);
        } catch {
            this.logger.debug(`Request error - '${createWebhookDto.url}' is not a URL`);
            throw new HttpException('Wrong url', HttpStatus.FORBIDDEN);
        }

        const webhook: Webhooks = await this.webhookService.createWebhook(createWebhookDto.url);
        this.logger.log(`New webhook: ${webhook.url}`);

        return webhook;
    }
    
    @Get()
    async getAll(): Promise<Webhooks[]> {
        return this.webhookService.getAllWebhooks();
    }

    @Get(':id')
    async getWebhook(@Param() getWebhookDto: GetWebhookDto): Promise<Webhooks> {
        return this.webhookService.getWebhook(getWebhookDto.id);
    }

    @UseGuards(AuthGuard)
    @Delete()
    async delete(@Body() deleteWebhookDto: DeleteWebhookDto): Promise<Webhooks> {
        const id = deleteWebhookDto.id;

        // Deleting all deliveries
        await this.deliveryService.deleteDeleveriesTo(id);

        // Deleting all hooks
        const associatedFlux = await this.bindingService.getAssociatedFlux(id);
        for (const flux of associatedFlux)
            await this.bindingService.deleteBinding(flux.id, id);

        const webhook = await this.webhookService.deleteWebhook(id);
        this.logger.log(`Webhook ${webhook.id} (${webhook.url}) has been deleted`);

        return webhook;
    }

    @UseGuards(AuthGuard)
    @Patch()
    async update(@Body() updateWebhookDto: UpdateWebhookDto): Promise<Webhooks> {
        const webhook = await this.webhookService.updateWebhook(updateWebhookDto.id, updateWebhookDto.url);
        this.logger.log(`Webhook ${webhook.id} updated, new URL: ${webhook.url}`);

        return webhook;
    }
}