import { Test, TestingModule } from '@nestjs/testing';
import { WebhookController } from './webhook.controller'
import { FluxService, WebhooksService, HooksService, ArticleService, DeliveryService, PrismaService } from '../services'
import { Request } from 'express';
import { HttpException } from '@nestjs/common';
import { assert } from 'console';

describe('Webhook Controller', () => {
    let webhookController: WebhookController;

    let prismaService: PrismaService;
    let fluxService: FluxService;
    let webhookService: WebhooksService;
    let hooksService: HooksService;
    let deliveryService: DeliveryService;
    let articleService: ArticleService;

    beforeAll(async () => {
        const app: TestingModule = await Test.createTestingModule({
            controllers: [WebhookController],
            providers: [WebhooksService, HooksService, DeliveryService, PrismaService],
        }).compile();

        prismaService = app.get<PrismaService>(PrismaService);
        webhookService = app.get<WebhooksService>(WebhooksService);
        deliveryService = app.get<DeliveryService>(DeliveryService);
        hooksService = app.get<HooksService>(HooksService);

        webhookController = app.get<WebhookController>(WebhookController);

        fluxService = new FluxService(prismaService);
        articleService = new ArticleService(prismaService);
    });

    beforeEach(async () => {
        await prismaService.deliveries.deleteMany();
        await prismaService.articles.deleteMany();
        await prismaService.hooks.deleteMany();
        await prismaService.flux.deleteMany();
        await prismaService.webhooks.deleteMany();
    });

    afterAll(async () => {
        await prismaService.deliveries.deleteMany();
        await prismaService.articles.deleteMany();
        await prismaService.hooks.deleteMany();
        await prismaService.flux.deleteMany();
        await prismaService.webhooks.deleteMany();
    });


    describe('create', () => {
        it('Missing url', async () => {
            let request = {
                body: {}
            } as unknown as Request;

            await expect(webhookController.create(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Wrong url - bad type', async () => {
            let request1 = {
                body: {
                    url: 1
                }
            } as unknown as Request;

            let request2 = {
                body: {
                    url: []
                }
            } as unknown as Request;

            await expect(webhookController.create(request1))
            .rejects
            .toThrow(HttpException);

            await expect(webhookController.create(request2))
            .rejects
            .toThrow(HttpException);
        });

        it('Wrong url - bad format', async () => {
            let request = {
                body: {
                    url: 'abc'
                }
            } as unknown as Request;

            await expect(webhookController.create(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Good url', async () => {
            let request = {
                body: {
                    url: 'http://toto.org'
                }
            } as unknown as Request;

            expect(await webhookController.create(request))
            .toEqual((await webhookService.getAllWebhooks())[0]);            
        });

        it('Register the same url', async () => {
            let request = {
                body: {
                    url: 'http://toto.org'
                }
            } as unknown as Request;

            await webhookController.create(request);
            
            await expect(webhookController.create(request))
            .rejects
            .toThrow(HttpException);
        });
    });

    describe('getAll', () => {
        it('Get all webhooks', async () => {
            expect(await webhookController.getAll())
            .toEqual(await webhookService.getAllWebhooks());

            for (let i=0; i<2; i++) {
                await webhookService.createWebhook(`url${i}`);

                expect(await webhookController.getAll())
                .toEqual(await webhookService.getAllWebhooks());
            }
        });
    });

    describe('delete', () => {
        it('Empty body', async () => {
            let request = {
                body: {}
            } as unknown as Request;

            await expect(webhookController.delete(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Unknow id', async () => {
            let request = {
                body: {
                    id: -1
                }
            } as unknown as Request;

            await expect(webhookController.delete(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Delete webhook and everything about it', async () => {
            let webhook = await webhookService.createWebhook('url');

            let flux = await fluxService.createFlux('url');

            let article = await articleService.createArticle('toto', flux.id);

            await hooksService.create_hook(flux.id, webhook.id);

            await deliveryService.createDelevery(webhook.id, article.id);

            let request = {
                body: {
                    id: webhook.id
                }
            } as unknown as Request;

            await webhookController.delete(request)

            expect((await webhookService.getAllWebhooks()).length)
            .toEqual(0);

            expect((await deliveryService.getDelevriesTo(webhook.id)).length)
            .toEqual(0);

            expect((await hooksService.get_hooked(webhook.id)).length)
            .toEqual(0);
        });
    });

    describe('update', () => {
        it('Empty body', async () => {
            let request = {
                body: {}
            } as unknown as Request;

            await expect(webhookController.update(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Missing url', async () => {
            let webhook = await webhookService.createWebhook('url');

            let request = {
                body: {
                    id: webhook.id
                }
            } as unknown as Request;

            await expect(webhookController.update(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Missing id', async () => {
            let request = {
                body: {
                    url: 'http://toto.org'
                }
            } as unknown as Request;

            await expect(webhookController.update(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Wrong id', async () => {
            let request = {
                body: {
                    id: 'abc',
                    url: 'http://toto.org'
                }
            } as unknown as Request;

            await expect(webhookController.update(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Unknow id', async () => {
            let request = {
                body: {
                    id: -1,
                    url: 'http://toto.org'
                }
            } as unknown as Request;

            await expect(webhookController.update(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Bad url', async () => {
            let webhook = await webhookService.createWebhook('url');

            let request = {
                body: {
                    id: webhook.id,
                    url: 'Not an url'
                }
            } as unknown as Request;

            await expect(webhookController.update(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Good id & good url', async () => {
            let webhook = await webhookService.createWebhook('url');

            let request = {
                body: {
                    id: webhook.id,
                    url: 'http://toto.fr'
                }
            } as unknown as Request;

            expect(await webhookController.update(request))
            .toBeTruthy();
        });
    });


});