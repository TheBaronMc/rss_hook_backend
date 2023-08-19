import { Controller, Get, Param, UseFilters } from '@nestjs/common';
import { DeliveryService } from '../services/deliveries.service';
import { PrismaClientKnownRequestErrorFilter } from '../exceptionFilters/prisma-client-known-request-error.filter';

import { Articles, Webhooks } from '@prisma/client';

import { GetDeliveryDstDto, GetDeliverySrcDto } from '../dataTranferObjects/delivery.dto';

@Controller('deliveries')
@UseFilters(PrismaClientKnownRequestErrorFilter)
export class DeliveriesController {

    constructor(private readonly deliveryService: DeliveryService) {}
    
    @Get('articles/:id')
    async getAllDeliveryDestination(@Param() getDeliveryDstDto: GetDeliveryDstDto): Promise<Webhooks[]> {        
        return this.deliveryService.getDelevriesOf(getDeliveryDstDto.id);
    }

    @Get('webhooks/:id')
    async getAllDeliveriesTo(@Param() getDeliverySrcDto: GetDeliverySrcDto): Promise<Articles[]> {
        return this.deliveryService.getDelevriesTo(getDeliverySrcDto.id);
    }

}