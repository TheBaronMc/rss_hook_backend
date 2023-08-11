import { Controller, Logger, Delete, Get, HttpException, HttpStatus, Patch, Post, Req } from '@nestjs/common';
import { HooksService } from '../services/hooks.service';
import { WebhooksService } from '../services/webhooks.service';
import { FluxService } from '../services/flux.service';

import { Webhooks, Flux } from '@prisma/client';

import { Request } from 'express';

@Controller('hooks')
export class HooksController {
    private readonly logger = new Logger();

    constructor(private readonly hookService: HooksService,
        private readonly webhookService: WebhooksService,
        private readonly fluxService: FluxService) {}

    @Post()
    async create(@Req() request: Request) {
        if (!request.body.flux_id) {
            this.logger.debug('Request error - No flux ID');
            throw new HttpException('A flux id is required', HttpStatus.FORBIDDEN);
        }
        if (!request.body.webhook_id) {
            this.logger.debug('Request error - No webhook ID');
            throw new HttpException('A webhook is required', HttpStatus.FORBIDDEN);
        }

        if (!(await this.fluxExist(request.body.flux_id))) {
            this.logger.debug(`Request error - flux ${request.body.flux_id} does not exist`);
            throw new HttpException('This flux id doesn\'t exist', HttpStatus.FORBIDDEN);
        }
        if (!(await this.webhookExist(request.body.webhook_id))) {
            this.logger.debug(`Request error - webhook ${request.body.webhook_id} does not exist`);
            throw new HttpException('This webhook id doesn\'t exist', HttpStatus.FORBIDDEN);
        }
            
        let res = await this.hookService.create_hook(request.body.flux_id, request.body.webhook_id);
        if (res) {
            this.logger.log(`Hook created between flux ${request.body.flux_id} and webhook ${request.body.webhook_id}`);
        } else {
            this.logger.log(`Hook already exists between flux ${request.body.flux_id} and webhook ${request.body.webhook_id}`);
        }

        return res;
    }
    
    @Get('webhook')
    async getAllFluxAttached(@Req() request: Request): Promise<Flux[]> {
        if (!request.query.id)
            throw new HttpException('An id is required', HttpStatus.FORBIDDEN);

        let id = parseInt(request.query.id as string);
        if (isNaN(id) || !(await this.webhookExist(id)))
            throw new HttpException('This webhook id doesn\'t exist', HttpStatus.FORBIDDEN);

        return this.hookService.get_hooked(id);
    }

    @Get('flux')
    async getAllWebhookAttached(@Req() request: Request): Promise<Webhooks[]> {
        if (!request.query.id)
            throw new HttpException('An id is required', HttpStatus.FORBIDDEN);

        let id = parseInt(request.query.id as string);
        if (isNaN(id) || !(await this.fluxExist(id)))
            throw new HttpException('This flux id doesn\'t exist', HttpStatus.FORBIDDEN);

        return this.hookService.get_hooks(id);
    }

    @Delete()
    async delete(@Req() request: Request) {
        if (!request.body.flux_id)
            throw new HttpException('A flux id is required', HttpStatus.FORBIDDEN);
        if (!request.body.webhook_id)
            throw new HttpException('A webhook is required', HttpStatus.FORBIDDEN);

        if (!(await this.fluxExist(request.body.flux_id)))
            throw new HttpException('This flux id doesn\'t exist', HttpStatus.FORBIDDEN);
        if (!(await this.webhookExist(request.body.webhook_id)))
            throw new HttpException('This webhook id doesn\'t exist', HttpStatus.FORBIDDEN);

        return this.hookService.delete_hook(request.body.flux_id, request.body.webhook_id);
    }

    private async webhookExist(id: number): Promise<boolean> {
        return (await this.webhookService.getAllWebhooks()).some(wh => wh.id == id);
    }

    private async fluxExist(id: number): Promise<boolean> {
        return (await this.fluxService.getAllFlux()).some(fl => fl.id == id);
    }
}