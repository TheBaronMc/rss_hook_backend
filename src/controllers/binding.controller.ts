import { Controller, Delete, Get, Post, UseFilters, Body, Param, UsePipes, ValidationPipe, UseGuards } from '@nestjs/common';
import { BindingService } from '../services/bindings.service';
import { PrismaClientKnownRequestErrorFilter } from '../exceptionFilters/prisma-client-known-request-error.filter';

import { Webhooks, Flux, Bindings } from '@prisma/client';

import { CreateBindingDto, DeleteBindingDto, GetFluxBindingsDto, GetWebhookBindingsDto } from '../dataTranferObjects/binding.dto';
import { AuthGuard } from '../guards/auth/auth.guard';

@Controller('bindings')
@UseFilters(PrismaClientKnownRequestErrorFilter)
@UsePipes(new ValidationPipe({ transform: true }))
export class BindingsController {

    constructor(private readonly bindingService: BindingService) {}

    @UseGuards(AuthGuard)
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

    @UseGuards(AuthGuard)
    @Delete()
    async delete(@Body() deleteBindingDto: DeleteBindingDto): Promise<Bindings> {
        return this.bindingService.deleteBinding(deleteBindingDto.fluxId, deleteBindingDto.webhookId);
    }

}