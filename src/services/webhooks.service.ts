import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Webhooks } from '@prisma/client';

@Injectable()
export class WebhooksService {
    constructor(private prisma: PrismaService) {}

    async getAllWebhooks(): Promise<Webhooks[]> {
        return this.prisma.webhooks.findMany();
    }

    async getWebhook(id: number): Promise<Webhooks> {
        return this.prisma.webhooks.findFirst({
            where: { id }
        });
    }

    async createWebhook(url: string): Promise<Webhooks> {
        return this.prisma.webhooks.create({
            data: { url }
        });
    }

    async deleteWebhook(id: number): Promise<Webhooks> {
        return this.prisma.webhooks.delete({
            where: { id }
        });
    }

    async updateWebhook(id: number, url: string): Promise<Webhooks> {
        return this.prisma.webhooks.update({
            data: { url },
            where: { id }
        });
    }
}