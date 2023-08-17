import { Test, TestingModule } from '@nestjs/testing';
import { WebhookController } from './webhook.controller';
import { FluxService, WebhooksService, BindingService, ArticleService, DeliveryService, PrismaService } from '../services';
import { Request } from 'express';
import { HttpException } from '@nestjs/common';

describe('Webhook Controller', () => {
    let webhookController: WebhookController;

    let prismaService: PrismaService;
    let fluxService: FluxService;
    let webhookService: WebhooksService;
    let bindingService: BindingService;
    let deliveryService: DeliveryService;
    let articleService: ArticleService;

    let app: TestingModule;

    beforeAll(async () => {
        app = await Test.createTestingModule({
            controllers: [WebhookController],
            providers: [WebhooksService, BindingService, DeliveryService, PrismaService],
        }).compile();

        prismaService = app.get<PrismaService>(PrismaService);
        webhookService = app.get<WebhooksService>(WebhooksService);
        deliveryService = app.get<DeliveryService>(DeliveryService);
        bindingService = app.get<BindingService>(BindingService);

        webhookController = app.get<WebhookController>(WebhookController);

        fluxService = new FluxService(prismaService);
        articleService = new ArticleService(prismaService);
    });

    beforeEach(async () => {
        await prismaService.deliveries.deleteMany();
        await prismaService.articles.deleteMany();
        await prismaService.bindings.deleteMany();
        await prismaService.flux.deleteMany();
        await prismaService.webhooks.deleteMany();
    });

    afterAll(async () => {
        await prismaService.deliveries.deleteMany();
        await prismaService.articles.deleteMany();
        await prismaService.bindings.deleteMany();
        await prismaService.flux.deleteMany();
        await prismaService.webhooks.deleteMany();

        await app.close();
    });


    describe('create', () => {
        it('Missing url', async () => {
            const request = {
                body: {}
            } as unknown as Request;

            await expect(webhookController.create(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Wrong url - bad type', async () => {
            const firstRequest = {
                body: {
                    url: 1
                }
            } as unknown as Request;

            const secondRequest = {
                body: {
                    url: []
                }
            } as unknown as Request;

            await expect(webhookController.create(firstRequest))
            .rejects
            .toThrow(HttpException);

            await expect(webhookController.create(secondRequest))
            .rejects
            .toThrow(HttpException);
        });

        it('Wrong url - bad format', async () => {
            const request = {
                body: {
                    url: 'abc'
                }
            } as unknown as Request;

            await expect(webhookController.create(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Good url', async () => {
            const request = {
                body: {
                    url: 'http://toto.org'
                }
            } as unknown as Request;

            expect(await webhookController.create(request))
            .toEqual((await webhookService.getAllWebhooks())[0]);            
        });

        it('Register the same url', async () => {
            const request = {
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
            const request = {
                body: {}
            } as unknown as Request;

            await expect(webhookController.delete(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Unknow id', async () => {
            const request = {
                body: {
                    id: -1
                }
            } as unknown as Request;

            await expect(webhookController.delete(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Delete webhook and everything about it', async () => {
            const webhook = await webhookService.createWebhook('url');
            const flux = await fluxService.createFlux('url');
            const article = await articleService.createArticle('toto', flux.id);

            await bindingService.createBinding(flux.id, webhook.id);

            await deliveryService.createDelevery(webhook.id, article.id);

            const request = {
                body: {
                    id: webhook.id
                }
            } as unknown as Request;

            await webhookController.delete(request);

            expect((await webhookService.getAllWebhooks()).length)
            .toEqual(0);

            expect((await deliveryService.getDelevriesTo(webhook.id)).length)
            .toEqual(0);

            expect((await bindingService.getAssociatedFlux(webhook.id)).length)
            .toEqual(0);
        });
    });

    describe('update', () => {
        it('Empty body', async () => {
            const request = {
                body: {}
            } as unknown as Request;

            await expect(webhookController.update(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Missing url', async () => {
            const webhook = await webhookService.createWebhook('url');

            const request = {
                body: {
                    id: webhook.id
                }
            } as unknown as Request;

            await expect(webhookController.update(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Missing id', async () => {
            const request = {
                body: {
                    url: 'http://toto.org'
                }
            } as unknown as Request;

            await expect(webhookController.update(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Wrong id', async () => {
            const request = {
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
            const request = {
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
            const webhook = await webhookService.createWebhook('url');

            const request = {
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
            const webhook = await webhookService.createWebhook('url');

            const request = {
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