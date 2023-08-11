import { Test, TestingModule } from '@nestjs/testing';
import { DeliveriesController } from './deliveries.controller';
import { ArticleService, FluxService, WebhooksService, DeliveryService, PrismaService } from '../services'
import { Request } from 'express';
import { HttpException } from '@nestjs/common';

describe('Delivery Controller', () => {
    let deliveryController: DeliveriesController;

    let prismaService: PrismaService;
    let articleService: ArticleService;
    let fluxService: FluxService;
    let webhookService: WebhooksService;
    let deliveryService: DeliveryService;

    let app: TestingModule;

    beforeAll(async () => {
        app = await Test.createTestingModule({
            controllers: [DeliveriesController],
            providers: [DeliveryService, PrismaService],
        }).compile();

        
        prismaService = app.get<PrismaService>(PrismaService);
        deliveryService = app.get<DeliveryService>(DeliveryService);

        deliveryController = app.get<DeliveriesController>(DeliveriesController);

        articleService = new ArticleService(prismaService);
        fluxService = new FluxService(prismaService);
        webhookService = new WebhooksService(prismaService);
    });

    beforeEach(async () => {
        await prismaService.deliveries.deleteMany();
        await prismaService.articles.deleteMany();
        await prismaService.flux.deleteMany();
        await prismaService.webhooks.deleteMany();
    });

    afterAll(async () => {
        await prismaService.deliveries.deleteMany();
        await prismaService.articles.deleteMany();
        await prismaService.flux.deleteMany();
        await prismaService.webhooks.deleteMany();

        await app.close()
    });

    describe('getAllDeliveriesContentOf', () => {
        it('Empty request', async () => {
            let request = { 
                query: {}
            } as Request
            await expect(
                deliveryController.getAllDeliveriesContentOf(request)
                )
                .rejects
                .toThrow(HttpException);
        });
    
        it('Wrong id', async () => {
            let request = { 
                query: {
                    id: 1
                }
            } as unknown as Request;
            expect(await deliveryController.getAllDeliveriesContentOf(request)).toEqual([]);
        });

        it('Wrong id', async () => {
            let request = { 
                query: {
                    id: "1"
                }
            } as unknown as Request;
            expect(await deliveryController.getAllDeliveriesContentOf(request)).toEqual([]);
        });

        it('Wrong id', async () => {
            let request = { 
                query: {
                    id: "abc"
                }
            } as unknown as Request;
            await expect(deliveryController.getAllDeliveriesContentOf(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Wrong id', async () => {
            let request = { 
                query: {
                    id: []
                }
            } as unknown as Request;
            await expect(deliveryController.getAllDeliveriesContentOf(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Webhook with no deliveries', async () => {
            let webhook = await webhookService.createWebhook('url');
            let request = { 
                query: {
                    id: webhook.id
                }
            } as unknown as Request;
            expect(await deliveryController.getAllDeliveriesContentOf(request)).toEqual([]);
        });

        it('Webhook with no deliveries', async () => {
            let webhook = await webhookService.createWebhook('url');
            let flux = await fluxService.createFlux('url');
            for (let i=0; i<2; i++) {
                let article = await articleService.createArticle('title', flux.id);
                await deliveryService.createDelevery(webhook.id, article.id);
            }
            let request = { 
                query: {
                    id: webhook.id
                }
            } as unknown as Request;
            expect(await deliveryController.getAllDeliveriesContentOf(request))
            .toEqual(await deliveryService.getDelevriesTo(webhook.id));
        });
    });
    
    describe('getAllDeliveryDestination', () => {
        it('Empty request', async () => {
            let request = { 
                query: {}
            } as Request
            await expect(
                deliveryController.getAllDeliveryDestination(request)
                )
                .rejects
                .toThrow(HttpException);
        });
    
        it('Wrong id', async () => {
            let request = { 
                query: {
                    id: 1
                }
            } as unknown as Request;
            expect(await deliveryController.getAllDeliveryDestination(request)).toEqual([]);
        });

        it('Wrong id', async () => {
            let request = { 
                query: {
                    id: "1"
                }
            } as unknown as Request;
            expect(await deliveryController.getAllDeliveryDestination(request)).toEqual([]);
        });

        it('Wrong id', async () => {
            let request = { 
                query: {
                    id: "abc"
                }
            } as unknown as Request;
            await expect(deliveryController.getAllDeliveryDestination(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Wrong id', async () => {
            let request = { 
                query: {
                    id: []
                }
            } as unknown as Request;
            await expect(deliveryController.getAllDeliveryDestination(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Webhook with no deliveries', async () => {
            let flux = await fluxService.createFlux('url');
            let article = await articleService.createArticle('title', flux.id);
            let request = { 
                query: {
                    id: article.id
                }
            } as unknown as Request;
            expect(await deliveryController.getAllDeliveryDestination(request)).toEqual([]);
        });

        it('Webhook with no deliveries', async () => {
            let flux = await fluxService.createFlux('url');
            let article = await articleService.createArticle('title', flux.id);
            for (let i=0; i<2; i++) {
                let webhook = await webhookService.createWebhook(`url${i}`);
                await deliveryService.createDelevery(webhook.id, article.id);
            }
            let request = { 
                query: {
                    id: article.id
                }
            } as unknown as Request;
            expect(await deliveryController.getAllDeliveryDestination(request))
            .toEqual(await deliveryService.getDelevriesOf(article.id));
        });
    });
});