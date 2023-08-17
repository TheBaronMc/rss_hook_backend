import { Controller, Get, HttpException, HttpStatus, Req, UseFilters } from '@nestjs/common';
import { DeliveryService } from '../services/deliveries.service';
import { PrismaClientKnownRequestErrorFilter } from '../exceptionFilters/prisma-client-known-request-error.filter';

import { Articles, Webhooks } from '@prisma/client';

import { Request } from 'express';

@Controller('deliveries')
@UseFilters(PrismaClientKnownRequestErrorFilter)
export class DeliveriesController {

    constructor(private readonly deliveryService: DeliveryService) {}
    
    @Get('articles')
    async getAllDeliveryDestination(@Req() request: Request): Promise<Webhooks[]> {
        if (!request.query.id)
            throw new HttpException('An article id is required', HttpStatus.FORBIDDEN);

            let id: number;

            try {
                id = parseInt(request.query.id as string);
                if (isNaN(id)) {
                    throw new HttpException('Id should be a number', HttpStatus.FORBIDDEN);
                }
            } catch {
                throw new HttpException('Id should be a number', HttpStatus.FORBIDDEN);
            }
        
        return this.deliveryService.getDelevriesOf(id);
    }

    @Get('webhooks')
    async getAllDeliveriesContentOf(@Req() request: Request): Promise<Articles[]> {
        if (!request.query.id)
            throw new HttpException('A webhook id is required', HttpStatus.FORBIDDEN);

        let id: number;

        try {
            id = parseInt(request.query.id as string);
            if (isNaN(id)) {
                throw new HttpException('Id should be a number', HttpStatus.FORBIDDEN);
            }
        } catch {
            throw new HttpException('Id should be a number', HttpStatus.FORBIDDEN);
        }

        return this.deliveryService.getDelevriesTo(id);
    }

}