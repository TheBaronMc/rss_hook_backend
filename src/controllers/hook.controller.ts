import { Controller, Delete, Get, HttpException, HttpStatus, Patch, Post, Req } from '@nestjs/common';
import { HooksService } from '../services/hooks.service';
import { WebhooksService } from '../services/webhooks.service';
import { FluxService } from '../services/flux.service';

import { Webhooks, Flux } from '@prisma/client';

import { Request } from 'express';

@Controller()
export class HooksController {

    constructor(private readonly hookService: HooksService,
        private readonly webhookService: WebhooksService,
        private readonly fluxService: FluxService) {}

    @Post()
    async create(@Req() request: Request) {
        if (!request.body.flux_id)
            throw new HttpException('A flux id is required', HttpStatus.FORBIDDEN);
        if (!request.body.webhook_id)
            throw new HttpException('A webhook is required', HttpStatus.FORBIDDEN);

        if (!(await this.fluxExist(request.body.flux_id)))
            throw new HttpException('This flux id doesn\'t exist', HttpStatus.FORBIDDEN);
        if (!(await this.webhookExist(request.body.webhook_id)))
            throw new HttpException('This webhook id doesn\'t exist', HttpStatus.FORBIDDEN);

        return this.hookService.create_hook(request.body.flux_id, request.body.webhook_id);
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