import { Controller, Delete, Get, HttpException, HttpStatus, Patch, Post, Req } from '@nestjs/common';
import { WebhooksService } from '../services/webhooks.service';
import { HooksService } from '../services/hooks.service';
import { DeliveryService } from '../services/deliveries.service';

import { Webhooks } from '@prisma/client';

import { Request } from 'express';

@Controller('webhooks')
export class WebhookController {

    constructor(private readonly webhookService: WebhooksService,
        private readonly hookService: HooksService,
        private readonly deliveryService: DeliveryService) {}

    @Post()
    async create(@Req() request: Request) {
        if (!request.body.url)
            throw new HttpException('A url is required', HttpStatus.FORBIDDEN);

        try {
            new URL(request.body.url);
        } catch {
            throw new HttpException('Wrong url', HttpStatus.FORBIDDEN);
        }

        return this.webhookService.createWebhook(request.body.url);
    }
    
    @Get()
    async getAll(): Promise<Webhooks[]> {
        return this.webhookService.getAllWebhooks();
    }

    @Delete()
    async delete(@Req() request: Request) {
        if (!request.body.id)
            throw new HttpException('An id is required', HttpStatus.FORBIDDEN);

        if (!await this.exist(request.body.id))
            throw new HttpException('This id does not exist', HttpStatus.FORBIDDEN);

        let id = request.body.id;

        // Deleting all deliveries
        await this.deliveryService.deleteDeleveriesTo(id);

        // Deleting all hooks
        let flux = await this.hookService.get_hooked(id);
        for (let fl of flux)
            await this.hookService.delete_hook(fl.id, id);

        return this.webhookService.deleteWebhook(id);
    }

    @Patch()
    async update(@Req() request: Request) {
        if (!request.body.id)
            throw new HttpException('An id is required', HttpStatus.FORBIDDEN);
        if (!request.body.url)
            throw new HttpException('A url is required', HttpStatus.FORBIDDEN);

        try {
            new URL(request.body.url);
        } catch {
            throw new HttpException('Wrong url', HttpStatus.FORBIDDEN);
        }

        if (!await this.exist(request.body.id))
            throw new HttpException('Wrong id', HttpStatus.FORBIDDEN);

        return this.webhookService.updateWebhook(request.body.id, request.body.url);
    }

    private async exist(id: number): Promise<boolean> {
        return (await this.getAll()).some(wh => wh.id == id);
    }
}