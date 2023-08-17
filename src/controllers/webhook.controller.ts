import { Controller, Logger, Delete, Get, HttpException, HttpStatus, Patch, Post, Req, UseFilters } from '@nestjs/common';
import { WebhooksService } from '../services/webhooks.service';
import { BindingService } from '../services/bindings.service';
import { DeliveryService } from '../services/deliveries.service';
import { PrismaClientKnownRequestErrorFilter } from '../exceptionFilters/prisma-client-known-request-error.filter';

import { Webhooks, Prisma } from '@prisma/client';

import { Request } from 'express';

@Controller('webhooks')
@UseFilters(PrismaClientKnownRequestErrorFilter)
export class WebhookController {
    private readonly logger = new Logger(WebhookController.name);

    constructor(private readonly webhookService: WebhooksService,
        private readonly bindingService: BindingService,
        private readonly deliveryService: DeliveryService) {}

    @Post()
    async create(@Req() request: Request): Promise<Webhooks>  {
        if (!request.body.url) {
            this.logger.debug("Request error - Missing url");
            throw new HttpException('A url is required', HttpStatus.FORBIDDEN);
        }

        try {
            new URL(request.body.url);
        } catch {
            this.logger.debug(`Request error - '${request.body.url}' is not a URL`);
            throw new HttpException('Wrong url', HttpStatus.FORBIDDEN);
        }

        let webhook: Webhooks;
        try {
            webhook = await this.webhookService.createWebhook(request.body.url);
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    this.logger.debug(`Request error - '${request.body.url}' already registered`);
                    throw new HttpException('This URL is already registered', HttpStatus.FORBIDDEN);
                }
            }
        }

        this.logger.log(`New webhook: ${request.body.url}`);

        return webhook;
    }
    
    @Get()
    async getAll(): Promise<Webhooks[]> {
        return this.webhookService.getAllWebhooks();
    }

    @Delete()
    async delete(@Req() request: Request): Promise<Webhooks> {
        if (!request.body.id) {
            this.logger.debug("Request error - Missing id");
            throw new HttpException('An id is required', HttpStatus.FORBIDDEN);
        }

        if (!await this.exist(request.body.id)) {
            this.logger.debug(`Request error - No webhook with id ${request.body.id}`);
            throw new HttpException('This id does not exist', HttpStatus.FORBIDDEN);
        }

        const id = request.body.id;

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

    @Patch()
    async update(@Req() request: Request): Promise<Webhooks> {
        if (!request.body.id) {
            this.logger.debug('Request error - Missing id');
            throw new HttpException('An id is required', HttpStatus.FORBIDDEN);
        }
            
        if (!request.body.url) {
            this.logger.debug('Request error - Missing URL');
            throw new HttpException('A url is required', HttpStatus.FORBIDDEN);
        }

        try {
            new URL(request.body.url);
        } catch {
            this.logger.debug(`Request error - '${request.body.url}' is not a URL`);
            throw new HttpException('Wrong url', HttpStatus.FORBIDDEN);
        }

        if (!await this.exist(request.body.id)) {
            this.logger.debug(`Request error - No webhook with id '${request.body.id}'`);
            throw new HttpException('Wrong id', HttpStatus.FORBIDDEN);
        }
        
        const webhook = await this.webhookService.updateWebhook(request.body.id, request.body.url);
        this.logger.log(`Webhook ${webhook.id} updated, new URL: ${webhook.url}`);

        return webhook;
    }

    private async exist(id: number): Promise<boolean> {
        return (await this.getAll()).some(wh => wh.id == id);
    }
}