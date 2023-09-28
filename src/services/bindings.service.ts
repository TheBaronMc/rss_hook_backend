import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Flux, Bindings, Webhooks, } from '@prisma/client';

@Injectable()
export class BindingService {
    constructor(private prisma: PrismaService) {}

    async createBinding(fluxId: number, webhookId: number): Promise<Bindings> {
        return this.prisma.bindings.create({
            data: {
                fluxId,
                webhookId
            }
        });
    }

    async getAssociatedFlux(webhookId: number): Promise<Flux[]> {
        const result = await this.prisma.bindings.findMany({
            select: {
                flux: true
            },
            where: {
                webhookId
            }
        });
        
        return result.map((tuple) => tuple.flux);
    }

    async getAssociatedWebhooks(fluxId: number): Promise<Webhooks[]> {
        const result = await this.prisma.bindings.findMany({
            select: {
                webhook: true
            },
            where: {
                fluxId
            }
        });
        
        return result.map((tuple) => tuple.webhook);
    }

    async deleteBinding(fluxId: number, webhookId: number): Promise<Bindings> {
        return this.prisma.bindings.delete({
            where: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                fluxId_webhookId: {
                    webhookId,
                    fluxId
                }
            }
        });
    }
}