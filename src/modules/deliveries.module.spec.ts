import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { DeliveriesModule } from './deliveries.module';
import { DeliveryService, FluxService, ArticleService, WebhooksService, PrismaService } from '../services';
import { INestApplication } from '@nestjs/common';

describe('Delivery Module', () => {
    let app: INestApplication;

    let deliveryService: DeliveryService;
    let prismaService: PrismaService;
    let fluxService: FluxService;
    let webhooksService: WebhooksService;
    let articleService: ArticleService;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [DeliveriesModule],
        }).compile();

        deliveryService = moduleRef.get<DeliveryService>(DeliveryService);
        prismaService = moduleRef.get<PrismaService>(PrismaService);

        fluxService = new FluxService(prismaService);
        articleService = new ArticleService(prismaService);
        webhooksService = new WebhooksService(prismaService);

        app = moduleRef.createNestApplication();
        await app.init();
    });

    beforeEach(async () => {
        await prismaService.deliveries.deleteMany();
        await prismaService.articles.deleteMany();
        await prismaService.bindings.deleteMany();
        await prismaService.webhooks.deleteMany();
        await prismaService.flux.deleteMany();
    });

    describe('GET /deliveries/articles', () => {
        it('Wrong id 1', () => {
            return request(app.getHttpServer())
              .get('/deliveries/articles/1')
              .expect([]);
        });

        it('Wrong id 2', async () => {
            const response = await request(app.getHttpServer())
              .get('/deliveries/articles/abc');

            expect(response.body.statusCode >= 300).toBeTruthy();
        });

        it('Wrong id 3', async () => {
            const response = await request(app.getHttpServer())
              .get('/deliveries/articles/');

            expect(response.body.statusCode >= 300).toBeTruthy();
        });

        it('Good article but no devlivery', async () => {
            const aFlux = await fluxService.createFlux('url');
            const anArticle = await articleService.createArticle('aTitle', aFlux.id);

            const response = await request(app.getHttpServer())
            .get(`/deliveries/articles/${anArticle.id}`);

            expect(response.body.length).toEqual(0);
        });

        it('Good article', async () => {
            const aFlux = await fluxService.createFlux('url');
            const aWebhook = await webhooksService.createWebhook('url');
            const anArticle = await articleService.createArticle('aTitle', aFlux.id);

            await deliveryService.createDelevery(aWebhook.id, anArticle.id);

            const response = await request(app.getHttpServer())
            .get(`/deliveries/articles/${anArticle.id}`);

            expect(response.body.length).toEqual(1);
        });
    });

    describe('GET /deliveries/webhooks', () => {
        it('Wrong id 1', () => {
            return request(app.getHttpServer())
              .get('/deliveries/webhooks/1')
              .expect([]);
        });

        it('Wrong id 2', async () => {
            const response = await request(app.getHttpServer())
              .get('/deliveries/webhooks/abc');

            expect(response.body.statusCode >= 300).toBeTruthy();
        });

        it('Wrong id 3', async () => {
            const response = await request(app.getHttpServer())
              .get('/deliveries/webhooks/');

            expect(response.body.statusCode >= 300).toBeTruthy();
        });

        it('Good article but no devlivery', async () => {
            const aWebhook = await webhooksService.createWebhook('url');

            const response = await request(app.getHttpServer())
            .get(`/deliveries/webhooks/${aWebhook.id}`);

            expect(response.body.length).toEqual(0);
        });

        it('Good article', async () => {
            const aFlux = await fluxService.createFlux('url');
            const aWebhook = await webhooksService.createWebhook('url');
            const anArticle = await articleService.createArticle('aTitle', aFlux.id);

            await deliveryService.createDelevery(aWebhook.id, anArticle.id);

            const response = await request(app.getHttpServer())
            .get(`/deliveries/webhooks/${aWebhook.id}`);

            expect(response.body.length).toEqual(1);
        });
    });

    afterAll(async () => {
        await prismaService.deliveries.deleteMany();
        await prismaService.articles.deleteMany();
        await prismaService.bindings.deleteMany();
        await prismaService.webhooks.deleteMany();
        await prismaService.flux.deleteMany();

        await app.close();
    });
});