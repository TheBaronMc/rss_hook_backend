import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Articles, Deliveries, Webhooks } from '@prisma/client';

@Injectable()
export class DeliveryService {
    constructor(private prisma: PrismaService) {}

    /**
     * Creates delivery
     * @param webhookId destination id
     * @param articleId id of article to deliver
     * @returns false if one of the two memeber doesn't exit, true otherwise
     */
    async createDelevery(webhookId: number, articleId: number): Promise<Deliveries> {
        return this.prisma.deliveries.create({
            data: {
                contentId: articleId,
                receiverId: webhookId
            }
        });
    }

    /**
     * Deletes one delivery
     * @param webhookId 
     * @param articleId 
     * @returns 
     */
    async deleteDelevery(webhookId: number, articleId: number): Promise<Deliveries> {
        return this.prisma.deliveries.delete({
            where: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                receiverId_contentId: {
                    contentId: articleId,
                    receiverId: webhookId
                }
            }
        });
    }

    /**
     * Deletes all deleveries to a webhook
     * @param webhookId 
     * @returns 
     */
    async deleteDeleveriesTo(webhookId: number): Promise<number> {
        const result = await this.prisma.deliveries.deleteMany({
            where: {
                receiverId: webhookId
            }
        });

        return result.count;
    }

    /**
     * Deletes all deleveries of an article
     * @param articleId 
     * @returns 
     */
    async deleteDeleveriesOf(articleId: number): Promise<number> {
        const result = await this.prisma.deliveries.deleteMany({
            where: {
                contentId: articleId
            }
        });

        return result.count;
    }

    /**
     * Returns all articles received by the webhook
     * @param webhookId 
     * @returns 
     */
    async getDelevriesTo(webhookId: number): Promise<Articles[]> {
        const result = await this.prisma.deliveries.findMany({
            select: {
                content: true
            },
            where: {
                receiverId: webhookId
            }
        });

        return result.map(delivery => delivery.content);
    }

    /**
     * Returns all webhookds which received the article
     * @param articleId 
     * @returns 
     */
     async getDelevriesOf(articleId: number): Promise<Webhooks[]> {
        return (await this.prisma.deliveries.findMany(
            {
                select: {
                    receiver: true
                },
                where: {
                    contentId: articleId
                }
            })).map(delivery => delivery.receiver);
    }

}