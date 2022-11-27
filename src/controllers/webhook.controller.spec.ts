import { Test, TestingModule } from '@nestjs/testing';
import { WebhookController } from './webhook.controller'
import { FluxService, WebhooksService, HooksService, ArticleService, DeliveryService, PrismaService } from '../services'
import { Request } from 'express';
import { HttpException } from '@nestjs/common';

describe('Webhook Controller', () => {
    let webhookController: WebhookController;

    let prismaService = new PrismaService();
    let fluxService = new FluxService(prismaService);
    let webhookService = new WebhooksService(prismaService);
    let hooksService = new HooksService(prismaService);
    let deliveryService = new DeliveryService(prismaService);
    let articleService = new ArticleService(prismaService);

    let ereaseData = async () => {

    };

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({
            controllers: [WebhookController],
            providers: [WebhooksService, HooksService, DeliveryService, PrismaService],
        }).compile();

        webhookController = app.get<WebhookController>(WebhookController);

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

            console.log((await webhookService.getAllWebhooks()).length);
            
        });

        it('Register the same url', async () => {
            let request = {
                body: {
                    url: 'http://toto.org'
                }
            } as unknown as Request;

            await webhookController.create(request);
            
            await webhookController.create(request);
        });
    });

    describe('getAll', () => {
        it('Get all webhooks', async () => {
            expect(await webhookController.getAll())
            .toEqual(await webhookService.getAllWebhooks());

            for (let i=0; i<2; i++) {
                await webhookService.createWebhook('url');

                expect(await webhookController.getAll())
                .toEqual(await webhookService.getAllWebhooks());
            }
        });
    });

    describe('delete', () => {});

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