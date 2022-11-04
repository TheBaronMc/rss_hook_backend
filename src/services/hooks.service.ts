import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Hooks, Flux, Webhooks, Prisma } from '@prisma/client';

@Injectable()
export class HooksService {
    constructor(private prisma: PrismaService) {}

    async create_hook(flux_id: number, webhook_id: number): Promise<boolean> {
        try {
            await this.prisma.hooks.create({
                data: {
                    destinationId: flux_id,
                    sourceId: webhook_id
                }
            });
            return true;
        } 
        catch {
            return false;
        }
    }

    async get_hooked(webhook_id: number): Promise<Flux[]> {
        return (await this.prisma.hooks.findMany({
            select: {
                destination: true
            },
            where: {
                sourceId: webhook_id
            }
        })).map((tuple) => tuple.destination);
    }

    async get_hooks(flux_id: number): Promise<Webhooks[]> {
        return (await this.prisma.hooks.findMany({
            select: {
                source: true
            },
            where: {
                destinationId: flux_id
            }
        })).map((tuple) => tuple.source);
    }

    async delete_hook(flux_id: number, webhook_id: number): Promise<boolean> {
        try {
            await this.prisma.hooks.delete({
                where: {
                    sourceId_destinationId: {
                        sourceId: webhook_id,
                        destinationId: flux_id
                    }
                }
            });
            return true;
        } catch {
            return false;
        }
    }
}