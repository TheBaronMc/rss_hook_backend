import { Controller, Delete, Get, Post, UseFilters, Body, Param } from '@nestjs/common';
import { BindingService } from '../services/bindings.service';
import { PrismaClientKnownRequestErrorFilter } from '../exceptionFilters/prisma-client-known-request-error.filter';

import { Webhooks, Flux, Bindings } from '@prisma/client';

import { CreateBindingDto, DeleteBindingDto, GetFluxBindingsDto, GetWebhookBindingsDto } from '../dataTranferObjects/binding.dto';

@Controller('hooks')
@UseFilters(PrismaClientKnownRequestErrorFilter)
export class BindingsController {

    constructor(private readonly bindingService: BindingService) {}

    @Post()
    async createBinding(@Body() createBindingDto: CreateBindingDto): Promise<Bindings> {
        return this.bindingService.createBinding(createBindingDto.fluxId, createBindingDto.webhookId);
    }
    
    @Get('webhook/:id')
    async getAllFluxAttached(@Param() getFluxBindingsDto: GetFluxBindingsDto): Promise<Flux[]> {
        return this.bindingService.getAssociatedFlux(getFluxBindingsDto.id);
    }

    @Get('flux/:id')
    async getAssociatedWebhooks(@Param() getWebhookBindingsDto: GetWebhookBindingsDto): Promise<Webhooks[]> {
        return this.bindingService.getAssociatedWebhooks(getWebhookBindingsDto.id);
    }

    @Delete()
    async delete(@Body() deleteBindingDto: DeleteBindingDto): Promise<Bindings> {
        return this.bindingService.deleteBinding(deleteBindingDto.fluxId, deleteBindingDto.webhookId);
    }

}