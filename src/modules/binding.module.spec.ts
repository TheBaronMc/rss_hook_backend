import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { BindingModule } from './binding.module';
import { BindingService, FluxService, WebhooksService, PrismaService } from '../services';
import { INestApplication } from '@nestjs/common';

describe('Binding Module', () => {
    let app: INestApplication;

    let bindingService: BindingService;
    let prismaService: PrismaService;
    let fluxService: FluxService;
    let webhooksService: WebhooksService;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [BindingModule],
        }).compile();

        bindingService = moduleRef.get<BindingService>(BindingService);
        prismaService = moduleRef.get<PrismaService>(PrismaService);

        fluxService = new FluxService(prismaService);
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

    describe('POST /bindings', () => {
        it('Flux - Wrong id 1', async () => {
            const aWebhook = await webhooksService.createWebhook('url');

            const response = await request(app.getHttpServer())
            .post('/bindings/')
            .send({
                fluxId: 1,
                webhookId: aWebhook.id
            });

            expect(response.body.statusCode >= 300).toBeTruthy();
        });

        it('Flux - Wrong id 2', async () => {
            const aWebhook = await webhooksService.createWebhook('url');

            const response = await request(app.getHttpServer())
            .post('/bindings/')
            .send({
                fluxId: 'abc',
                webhookId: aWebhook.id
            });

            expect(response.body.statusCode >= 300).toBeTruthy();
        });

        it('Flux - Wrong id 3', async () => {
            const aWebhook = await webhooksService.createWebhook('url');

            const response = await request(app.getHttpServer())
            .post('/bindings/')
            .send({
                fluxId: [],
                webhookId: aWebhook.id
            });

            expect(response.body.statusCode >= 300).toBeTruthy();
        });

        it('Webhook - Wrong id 1', async () => {
            const aFlux = await fluxService.createFlux('url');

            const response = await request(app.getHttpServer())
            .post('/bindings/')
            .send({
                fluxId: aFlux.id,
                webhookId: 1
            });

            expect(response.body.statusCode >= 300).toBeTruthy();
        });

        it('Webhook - Wrong id 2', async () => {
            const aFlux = await fluxService.createFlux('url');

            const response = await request(app.getHttpServer())
            .post('/bindings/')
            .send({
                fluxId: aFlux.id,
                webhookId: 'abc'
            });

            expect(response.body.statusCode >= 300).toBeTruthy();
        });

        it('Webhook - Wrong id 3', async () => {
            const aFlux = await fluxService.createFlux('url');

            const response = await request(app.getHttpServer())
            .post('/bindings/')
            .send({
                fluxId: aFlux.id,
                webhookId: []
            });

            expect(response.body.statusCode >= 300).toBeTruthy();
        });

        it('Good ids', async () => {
            const aFlux = await fluxService.createFlux('url');
            const aWebhook = await webhooksService.createWebhook('url');

            const response = await request(app.getHttpServer())
            .post('/bindings/')
            .send({
                fluxId: aFlux.id,
                webhookId: aWebhook.id
            });

            expect(response.statusCode >= 300).toBeFalsy();
            expect(response.body.fluxId).toEqual(aFlux.id);
            expect(response.body.webhookId).toEqual(aWebhook.id);
        });

        it('Two time create', async () => {
            const aFlux = await fluxService.createFlux('url');
            const aWebhook = await webhooksService.createWebhook('url');

            await request(app.getHttpServer())
            .post('/bindings/')
            .send({
                fluxId: aFlux.id,
                webhookId: aWebhook.id
            });

            const response = await request(app.getHttpServer())
            .post('/bindings/')
            .send({
                fluxId: aFlux.id,
                webhookId: aWebhook.id
            });

            expect(response.statusCode >= 300).toBeTruthy();
        });
    });

    describe('GET /bindings/webhook/:id', () => {
        it('Wrong id 1', () => {
            return request(app.getHttpServer())
              .get('/bindings/webhook/1')
              .expect([]);
        });

        it('Wrong id 2', async () => {
            const response = await request(app.getHttpServer())
              .get('/bindings/webhook/abc');

            expect(response.body.statusCode >= 300).toBeTruthy();
        });

        it('Wrong id 3', async () => {
            const response = await request(app.getHttpServer())
              .get('/bindings/webhook/');

            expect(response.body.statusCode >= 300).toBeTruthy();
        });

        it('Good webhook but no binding', async () => {
            const aWebhook = await webhooksService.createWebhook('url');

            const response = await request(app.getHttpServer())
            .get(`/bindings/webhook/${aWebhook.id}`);

            expect(response.body.length).toEqual(0);
        });

        it('Good webhook', async () => {
            const aFlux = await fluxService.createFlux('url');
            const aWebhook = await webhooksService.createWebhook('url');

            await bindingService.createBinding(aFlux.id, aWebhook.id);

            const response = await request(app.getHttpServer())
            .get(`/bindings/webhook/${aWebhook.id}`);

            expect(response.body.length).toEqual(1);
        });
    });

    describe('GET /bindings/flux/:id', () => {
        it('Wrong id 1', () => {
            return request(app.getHttpServer())
              .get('/bindings/flux/1')
              .expect([]);
        });

        it('Wrong id 2', async () => {
            const response = await request(app.getHttpServer())
              .get('/bindings/flux/abc');

            expect(response.body.statusCode >= 300).toBeTruthy();
        });

        it('Wrong id 3', async () => {
            const response = await request(app.getHttpServer())
              .get('/bindings/flux/');

            expect(response.body.statusCode >= 300).toBeTruthy();
        });

        it('Good flux but no binding', async () => {
            const aFlux = await fluxService.createFlux('url');

            const response = await request(app.getHttpServer())
            .get(`/bindings/flux/${aFlux.id}`);

            expect(response.body.length).toEqual(0);
        });

        it('Good flux', async () => {
            const aFlux = await fluxService.createFlux('url');
            const aWebhook = await webhooksService.createWebhook('url');

            await bindingService.createBinding(aFlux.id, aWebhook.id);

            const response = await request(app.getHttpServer())
            .get(`/bindings/flux/${aFlux.id}`);

            expect(response.body.length).toEqual(1);
        });
    });

    describe('DELETE /bindings', () => {
        it('Flux - Wrong id 1', async () => {
            const aWebhook = await webhooksService.createWebhook('url');

            const response = await request(app.getHttpServer())
            .delete('/bindings/')
            .send({
                fluxId: 1,
                webhookId: aWebhook.id
            });

            expect(response.body.statusCode >= 300).toBeTruthy();
        });

        it('Flux - Wrong id 2', async () => {
            const aWebhook = await webhooksService.createWebhook('url');

            const response = await request(app.getHttpServer())
            .delete('/bindings/')
            .send({
                fluxId: 'abc',
                webhookId: aWebhook.id
            });

            expect(response.body.statusCode >= 300).toBeTruthy();
        });

        it('Flux - Wrong id 3', async () => {
            const aWebhook = await webhooksService.createWebhook('url');

            const response = await request(app.getHttpServer())
            .delete('/bindings/')
            .send({
                fluxId: [],
                webhookId: aWebhook.id
            });

            expect(response.body.statusCode >= 300).toBeTruthy();
        });

        it('Webhook - Wrong id 1', async () => {
            const aFlux = await fluxService.createFlux('url');

            const response = await request(app.getHttpServer())
            .delete('/bindings')
            .send({
                fluxId: aFlux.id,
                webhookId: 1
            });

            expect(response.body.statusCode >= 300).toBeTruthy();
        });

        it('Webhook - Wrong id 2', async () => {
            const aFlux = await fluxService.createFlux('url');

            const response = await request(app.getHttpServer())
            .delete('/bindings')
            .send({
                fluxId: aFlux.id,
                webhookId: 'abc'
            });

            expect(response.body.statusCode >= 300).toBeTruthy();
        });

        it('Webhook - Wrong id 3', async () => {
            const aFlux = await fluxService.createFlux('url');

            const response = await request(app.getHttpServer())
            .delete('/bindings')
            .send({
                fluxId: aFlux.id,
                webhookId: []
            });

            expect(response.body.statusCode >= 300).toBeTruthy();
        });

        it('Good ids but no binding', async () => {
            const aFlux = await fluxService.createFlux('url');
            const aWebhook = await webhooksService.createWebhook('url');

            const response = await request(app.getHttpServer())
            .delete('/bindings')
            .send({
                fluxId: aFlux.id,
                webhookId: aWebhook.id
            });

            expect(response.statusCode >= 300).toBeTruthy();
        });

        it('Two time delete', async () => {
            const aFlux = await fluxService.createFlux('url');
            const aWebhook = await webhooksService.createWebhook('url');

            await request(app.getHttpServer())
            .delete('/bindings')
            .send({
                fluxId: aFlux.id,
                webhookId: aWebhook.id
            });

            const response = await request(app.getHttpServer())
            .delete('/bindings')
            .send({
                fluxId: aFlux.id,
                webhookId: aWebhook.id
            });

            expect(response.statusCode >= 300).toBeTruthy();
        });

        it('Good ids', async () => {
            const aFlux = await fluxService.createFlux('url');
            const aWebhook = await webhooksService.createWebhook('url');

            await bindingService.createBinding(aFlux.id, aWebhook.id);

            const response = await request(app.getHttpServer())
            .delete('/bindings')
            .send({
                fluxId: aFlux.id,
                webhookId: aWebhook.id
            });

            expect(response.statusCode >= 300).toBeFalsy();
            expect(response.body.fluxId).toEqual(aFlux.id);
            expect(response.body.webhookId).toEqual(aWebhook.id);
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