import { Test, TestingModule } from '@nestjs/testing';
import { FluxController } from './flux.controller'
import { ArticleService, DeliveryService, WebhooksService, HooksService, FluxService, PrismaService } from '../services'
import { Request } from 'express';
import { HttpException } from '@nestjs/common';
import { IncomingMessage, Server, ServerResponse } from 'http'

describe('Flux controller tests', () => {
    let fluxController: FluxController;

    let prismaService = new PrismaService();
    let articleService = new ArticleService(prismaService);
    let fluxService = new FluxService(prismaService);
    let webhookService = new WebhooksService(prismaService);
    let deliveryService = new DeliveryService(prismaService);
    let hookService = new HooksService(prismaService);

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({
            controllers: [FluxController],
            providers: [FluxService, ArticleService, HooksService, DeliveryService, PrismaService],
        }).compile();

        fluxController = app.get<FluxController>(FluxController);

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

        it('Good url', async () => {
            let request = {
                body: {
                    url: 'http://toto.org'
                }
            } as unknown as Request;

            expect(await fluxController.create(request))
            .toEqual((await fluxService.getAllFlux())[0]);
        });

        /*
        it('Update when new article show up', async () => {
            let server = new RssFluxTest();
            server.listen(80);

            let request = {
                body: {
                    url: 'http://localhost'
                }
            } as unknown as Request;
            let flux = await fluxController.create(request);

            server.addItem({
                title: 'Article 1',
                description: 'Great article',
                link: 'toto.org'
            })


            console.log(new Date());
            
            await new Promise(resolve => setTimeout(resolve, 4000));

            console.log(new Date());
            expect((await articleService.getArticles()).length)
            .toEqual(1);


            server.close();
        });
        */
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
                    url: 'http://toto.org'
                }
            } as unknown as Request;

            await expect(fluxController.update(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Good id and good url', async () => {
            const new_url = 'http://toto.org';

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

type item = { title: string, 
    description?: string, 
    link?: string };

class RssFluxTest extends Server {

    private items: Array<item> = [];

    constructor() {
        super()
        this.on('request', this.requestListener);
    }

    addItem(item: item) {
        this.items.push(item);
    }

    private itemsToString(): string {
        let str = "";
        for (let item of this.items) {
            let itemStr = "<item>";
            itemStr += '<title>' + item.title + '</title>';
            itemStr += '<description>' + item.description + '</description>';
            itemStr += '<link>' + item.link + '</link>';
            itemStr += '</item>';
            str += itemStr;
        }
        return str;
    }

    private requestListener(request: IncomingMessage, response: ServerResponse) {
        //response.setHeader('content-type', '')

        response.write(
            "<?xml version=\"1.0\"?>\n<rss version=\"2.0\"><channel><title>Test Rss Flux</title>" + this.itemsToString() + "</channel></rss>"
        );

        response.end();
    }
}