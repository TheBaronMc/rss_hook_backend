import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Articles, Webhooks } from '@prisma/client';

@Injectable()
export class DeliveryService {
    constructor(private prisma: PrismaService) {}

    /**
     * Creates delivery
     * @param webhook_id destination id
     * @param article_id id of article to deliver
     * @returns false if one of the two memeber doesn't exit, true otherwise
     */
    async createDelevery(webhook_id: number, article_id: number): Promise<boolean> {
        try {
            await this.prisma.deliveries.create({
                data: {
                    contentId: article_id,
                    receiverId: webhook_id
                }
            });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Deletes one delivery
     * @param webhook_id 
     * @param article_id 
     * @returns 
     */
    async deleteDelevery(webhook_id: number, article_id: number): Promise<boolean> {
        try {
            await this.prisma.deliveries.delete({
                where: {
                    receiverId_contentId: {
                        contentId: article_id,
                        receiverId: webhook_id
                    }
                }
            });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Deletes all deleveries to a webhook
     * @param webhook_id 
     * @returns 
     */
    async deleteDeleveriesTo(webhook_id: number) {
        try {
            await this.prisma.deliveries.deleteMany({
                where: {
                    receiverId: webhook_id
                }
            });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Deletes all deleveries of an article
     * @param article_id 
     * @returns 
     */
    async deleteDeleveriesOf(article_id: number) {
        try {
            await this.prisma.deliveries.deleteMany({
                where: {
                    contentId: article_id
                }
            });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Returns all articles received by the webhook
     * @param webhook_id 
     * @returns 
     */
    async getDelevriesTo(webhook_id: number): Promise<Articles[]> {
        return (await this.prisma.deliveries.findMany(
            {
                select: {
                    content: true
                },
                where: {
                    receiverId: webhook_id
                }
            })).map(delivery => delivery.content);
    }

    /**
     * Returns all webhookds which received the article
     * @param article_id 
     * @returns 
     */
     async getDelevriesOf(article_id: number): Promise<Webhooks[]> {
        return (await this.prisma.deliveries.findMany(
            {
                select: {
                    receiver: true
                },
                where: {
                    contentId: article_id
                }
            })).map(delivery => delivery.receiver);
    }

}