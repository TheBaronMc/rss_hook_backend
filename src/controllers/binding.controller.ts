import { Controller, Logger, Delete, Get, HttpException, HttpStatus, Patch, Post, Req, NotFoundException } from '@nestjs/common';
import { BindingService } from '../services/bindings.service';
import { WebhooksService } from '../services/webhooks.service';
import { FluxService } from '../services/flux.service';

import { Webhooks, Flux, Bindings } from '@prisma/client';

import { Request } from 'express';

@Controller('hooks')
export class BindingsController {
    private readonly logger = new Logger(BindingsController.name);

    constructor(private readonly bindingService: BindingService,
        private readonly webhookService: WebhooksService,
        private readonly fluxService: FluxService) {}

    @Post()
    async createBinding(@Req() request: Request): Promise<Bindings> {
        if (!request.body.fluxId) {
            this.logger.debug('Request error - No flux ID');
            throw new HttpException('A flux id is required', HttpStatus.FORBIDDEN);
        }
        if (!request.body.webhookId) {
            this.logger.debug('Request error - No webhook ID');
            throw new HttpException('A webhook is required', HttpStatus.FORBIDDEN);
        }

        try {
            const res = await this.bindingService.createBinding(request.body.fluxId, request.body.webhookId);
            if (res) {
                this.logger.log(`Hook created between flux ${request.body.fluxId} and webhook ${request.body.webhookId}`);
            } else {
                this.logger.log(`Hook already exists between flux ${request.body.fluxId} and webhook ${request.body.webhookId}`);
            }

            return res;
        } catch (error) {
            if (error) {
                throw new NotFoundException();
            }
        }
    }
    
    @Get('webhook')
    async getAllFluxAttached(@Req() request: Request): Promise<Flux[]> {
        if (!request.query.id)
            throw new HttpException('An id is required', HttpStatus.FORBIDDEN);

        const id = parseInt(request.query.id as string);
        if (isNaN(id) || !(await this.webhookExist(id)))
            throw new HttpException('This webhook id doesn\'t exist', HttpStatus.FORBIDDEN);

        return this.bindingService.getAssociatedFlux(id);
    }

    @Get('flux')
    async getAssociatedWebhooks(@Req() request: Request): Promise<Webhooks[]> {
        if (!request.query.id)
            throw new HttpException('An id is required', HttpStatus.FORBIDDEN);

        const id = parseInt(request.query.id as string);
        if (isNaN(id) || !(await this.fluxExist(id)))
            throw new HttpException('This flux id doesn\'t exist', HttpStatus.FORBIDDEN);

        return this.bindingService.getAssociatedWebhooks(id);
    }

    @Delete()
    async delete(@Req() request: Request): Promise<Bindings> {
        if (!request.body.fluxId)
            throw new HttpException('A flux id is required', HttpStatus.FORBIDDEN);
        if (!request.body.webhookId)
            throw new HttpException('A webhook is required', HttpStatus.FORBIDDEN);

        if (!(await this.fluxExist(request.body.fluxId)))
            throw new HttpException('This flux id doesn\'t exist', HttpStatus.FORBIDDEN);
        if (!(await this.webhookExist(request.body.webhookId)))
            throw new HttpException('This webhook id doesn\'t exist', HttpStatus.FORBIDDEN);

        return this.bindingService.deleteBinding(request.body.fluxId, request.body.webhookId);
    }

    private async webhookExist(id: number): Promise<boolean> {
        return (await this.webhookService.getAllWebhooks()).some(wh => wh.id == id);
    }

    private async fluxExist(id: number): Promise<boolean> {
        return (await this.fluxService.getAllFlux()).some(fl => fl.id == id);
    }
}