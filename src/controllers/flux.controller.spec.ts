import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';
import { FluxController } from './flux.controller'
import { ArticleService, DeliveryService, WebhooksService, HooksService, FluxService, PrismaService } from '../services'
import { Request } from 'express';
import { HttpException } from '@nestjs/common';

describe('Flux controller tests', () => {
    let fluxController: FluxController;

    let prismaService: PrismaService;
    let articleService: ArticleService;
    let fluxService: FluxService;
    let webhookService: WebhooksService;
    let deliveryService: DeliveryService;
    let hookService: HooksService;

    let app: TestingModule;

    beforeAll(async () => {
        app = await Test.createTestingModule({
            controllers: [FluxController],
            providers: [FluxService, ArticleService, HooksService, DeliveryService, PrismaService],
        }).compile();

        prismaService   = app.get<PrismaService>(PrismaService);
        fluxService     = app.get<FluxService>(FluxService);
        articleService  = app.get<ArticleService>(ArticleService);
        hookService     = app.get<HooksService>(HooksService);
        deliveryService = app.get<DeliveryService>(DeliveryService);

        fluxController  = app.get<FluxController>(FluxController);

        webhookService  = new WebhooksService(prismaService);

        await app.init();
    });

    beforeEach(async () => {
        await prismaService.deliveries.deleteMany();
        await prismaService.articles.deleteMany();
        await prismaService.hooks.deleteMany();
        await prismaService.webhooks.deleteMany();
        await prismaService.flux.deleteMany();
    });

    afterAll(async () => {
        await prismaService.deliveries.deleteMany();
        await prismaService.articles.deleteMany();
        await prismaService.hooks.deleteMany();
        await prismaService.webhooks.deleteMany();
        await prismaService.flux.deleteMany();

        fluxController.stopFeeder();
    });
    
    describe('create', () => {
        it('Missing url', async () => {
            let request = {
                body: {}
            } as unknown as Request;

            await expect(fluxController.update(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Bad url', async () => {
            let request = {
                body: {
                    url: 'Not an url'
                }
            } as unknown as Request;

            await expect(fluxController.update(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Good url but not a feed', async () => {
            let request = {
                body: {
                    url: 'http://toto.org'
                }
            } as unknown as Request;

            await expect(fluxController.create(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Good url and good feed', async () => {
            let request = {
                body: {
                    url: 'https://www.lemonde.fr/sport/rss_full.xml'
                }
            } as unknown as Request;

            expect(await fluxController.create(request))
            .toEqual((await fluxService.getAllFlux())[0]);
        });
    });

    describe('getAll', () => {
        it('Get all flux', async () => {
            expect(await fluxController.getAll())
            .toEqual(await fluxService.getAllFlux());

            for (let i=0; i<2; i++)
                expect(await fluxController.getAll())
                .toEqual(await fluxService.getAllFlux());
        });
    });

    describe('delete', () => {
        it('Missing id', async () => {
            let request = {
                body: {}
            } as unknown as Request;

            await expect(fluxController.delete(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Wrong id', async () => {
            let request = {
                body: {
                    id: -1
                }
            } as unknown as Request;

            await expect(fluxController.delete(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Unknow id', async () => {
            let request = {
                body: {
                    id: 'abc'
                }
            } as unknown as Request;

            await expect(fluxController.delete(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Remove flux and everything related to it', async () => {
            let flux = await fluxService.createFlux('url');
            let webhook = await webhookService.createWebhook('url');
            let article = await articleService.createArticle('toto', flux.id);

            await hookService.create_hook(flux.id, webhook.id);
            await deliveryService.createDelevery(webhook.id, article.id);

            let request = {
                body: {
                    id: flux.id
                }
            } as unknown as Request;

            await fluxController.delete(request);

            expect((await fluxService.getAllFlux()).length)
            .toEqual(0);

            expect((await articleService.getArticlesSendedBy(flux.id)).length)
            .toEqual(0);

            expect((await deliveryService.getDelevriesTo(webhook.id)).length)
            .toEqual(0);

            expect((await hookService.get_hooked(webhook.id)).length)
            .toEqual(0);
        });
    });

    describe('update', () => {
        it('Missing id', async () => {
            let request = {
                body: {
                    url: 'http://toto.org'
                }
            } as unknown as Request;

            await expect(fluxController.update(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Missing url', async () => {
            let flux = await fluxService.createFlux('url');

            let request = {
                body: {
                    id: flux.id
                }
            } as unknown as Request;

            await expect(fluxController.update(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Wrong id', async () => {
            let request = {
                body: {
                    id: 'abc'
                }
            } as unknown as Request;

            await expect(fluxController.update(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Wrong url', async () => {
            let flux = await fluxService.createFlux('url');

            let request = {
                body: {
                    id: flux.id,
                    url: 'Not an url'
                }
            } as unknown as Request;

            await expect(fluxController.update(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Unknow id', async () => {
            let request = {
                body: {
                    id: '-1',
                    url: 'https://www.lemonde.fr/sport/rss_full.xml'
                }
            } as unknown as Request;

            await expect(fluxController.update(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Good id and good url', async () => {
            const new_url = 'https://www.lemonde.fr/sport/rss_full.xml';

            let flux = await fluxService.createFlux('url');

            let request = {
                body: {
                    id: flux.id,
                    url: new_url
                }
            } as unknown as Request;

            await fluxController.update(request);

            expect((await fluxService.getFlux(flux.id)).url)
            .toEqual(new_url);
        });
    });
});