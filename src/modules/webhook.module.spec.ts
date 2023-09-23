import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { WebhookModule } from './webhook.module';
import { WebhooksService } from '../services/webhooks.service';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../services';
import { WebhookController } from '../controllers';
import { CreateWebhookDto } from '../dataTranferObjects/webhook.dto';

describe('WebhookModule', () => {
    let app: INestApplication;

    let webhooksService: WebhooksService;
    let webhooksController: WebhookController;
    let prismaService: PrismaService;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [WebhookModule],
        }).compile();

        webhooksService = moduleRef.get<WebhooksService>(WebhooksService);
        prismaService = moduleRef.get<PrismaService>(PrismaService);
        webhooksController = moduleRef.get<WebhookController>(WebhookController);

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

    describe('POST /webhooks', () => {
        it('Missing url', async () => {
            const response = await request(app.getHttpServer())
            .post('/webhooks')
            .send({ });
    
            expect(response.statusCode).not.toEqual(200);
        });

        it('Not flux', async () => {
            const response = await request(app.getHttpServer())
            .post('/webhooks')
            .send({ url: 'abcde124' });
    
            expect(response.statusCode).not.toEqual(200);
        });

        it('Bad flux', async () => {
            const response = await request(app.getHttpServer())
            .post('/webhooks')
            .send({ url: 'http://toto.fr' });
    
            expect(response.statusCode).not.toEqual(200);
        });
    
        it('Good flux', async () => {
            const response = await request(app.getHttpServer())
            .post('/webhooks')
            .send({ url: 'https://www.lemonde.fr/sport/rss_full.xml' });
    
            expect(response.body.url).toEqual('https://www.lemonde.fr/sport/rss_full.xml');
        });
    });

    describe('GET /webhooks', () => {
        it('Zero flux', async () => {
            const response = await request(app.getHttpServer())
            .get('/webhooks');
    
            expect(response.body.length).toEqual(0);
        });

        it('One flux', async () => {
            await webhooksService.createWebhook('https://www.lemonde.fr/sport/rss_full.xml');
            
            const response = await request(app.getHttpServer())
            .get('/webhooks');
    
            expect(response.body.length).toEqual(1);
        });
    });

    describe('GET /webhooks/:id', () => {
        it('Wrong id - 1', async () => {
            const response = await request(app.getHttpServer())
            .get('/webhooks/abc');
    
            expect(response.statusCode >= 300).toBeTruthy();
        });

        it('Wrong id - 2', async () => {
            const response = await request(app.getHttpServer())
            .get('/webhooks/-1');
    
            expect(response.statusCode >= 300).toBeTruthy();
        });

        it('Zero flux', async () => {
            const response = await request(app.getHttpServer())
            .get('/webhooks/1');
    
            expect(response.statusCode >= 300).toBeTruthy();
        });

        it('One flux', async () => {
            const aUrl = 'https://toto.fr';
            const createdWebhook = await webhooksService.createWebhook(aUrl);
            
            const response = await request(app.getHttpServer())
            .get(`/webhooks/${createdWebhook.id}`);
    
            expect(response.statusCode >= 300).toBeFalsy();

            expect(response.body.id).toEqual(createdWebhook.id);
            expect(response.body.url).toEqual(aUrl);
        });
    });

    describe('DELTE /webhooks', () => {
        it('Missing id', async () => {
            const response = await request(app.getHttpServer())
            .delete('/webhooks')
            .send({ });
    
            expect(response.statusCode).not.toEqual(200);
        });

        it('Wrong id - 1', async () => {
            const response = await request(app.getHttpServer())
            .delete('/webhooks')
            .send({ id: 1 });
    
            expect(response.statusCode).not.toEqual(200);
        });

        it('Wrong id - 2', async () => {
            const response = await request(app.getHttpServer())
            .delete('/webhooks')
            .send({ id: 'abc' });
    
            expect(response.statusCode).not.toEqual(200);
        });

        it('Good id', async () => {
            const createdWebhook = await webhooksService.createWebhook('https://www.lemonde.fr/sport/rss_full.xml');

            expect((await webhooksService.getAllWebhooks()).length)
            .toEqual(1);

            const response = await request(app.getHttpServer())
            .delete('/webhooks')
            .send({ id: createdWebhook.id });
    
            expect(response.statusCode >= 300).toBeFalsy();
            expect((await webhooksService.getAllWebhooks()).length)
            .toEqual(0);
        });
    });

    describe('PATCH /webhooks', () => {
        it('Missing arguments', async () => {
            const response = await request(app.getHttpServer())
            .patch('/webhooks')
            .send({ });
    
            expect(response.statusCode >= 300).toBeTruthy();
        });

        it('Missing id', async () => {
            const response = await request(app.getHttpServer())
            .patch('/webhooks')
            .send({ 
                url: 'https://www.lemonde.fr/sport/rss_full.xml'
            });
    
            expect(response.statusCode >= 300).toBeTruthy();
        });

        it('Missing url', async () => {
            const response = await request(app.getHttpServer())
            .patch('/webhooks')
            .send({ 
                id: 1
            });
    
            expect(response.statusCode >= 300).toBeTruthy();
        });

        it('Wrong id - 1', async () => {
            const response = await request(app.getHttpServer())
            .patch('/webhooks')
            .send({ 
                id: 1,
                url: 'https://www.lemonde.fr/sport/rss_full.xml'
            });
    
            expect(response.statusCode >= 300).toBeTruthy();
        });

        it('Wrong id - 2', async () => {
            const response = await request(app.getHttpServer())
            .patch('/webhooks')
            .send({ 
                id: 'abc',
                url: 'https://www.lemonde.fr/sport/rss_full.xml'
            });
    
            expect(response.statusCode >= 300).toBeTruthy();
        });

        /*
        it('Bad url', async () => {
            const aCreateWebhookDtpo = new CreateWebhookDto();
            aCreateWebhookDtpo.url = 'https://www.lemonde.fr/sport/rss_full.xml';
            const createdWebhook = await webhooksController.create(aCreateWebhookDtpo);

            const response = await request(app.getHttpServer())
            .patch('/webhooks')
            .send({ 
                id: createdWebhook.id,
                url: 'abc'
            });
    
            expect(response.statusCode >= 300).toBeTruthy();
        });
        */

        it('Good', async () => {
            const aCreateWebhookDtpo = new CreateWebhookDto();
            aCreateWebhookDtpo.url = 'https://www.lemonde.fr/sport/rss_full.xml';
            const createdWebhook = await webhooksController.create(aCreateWebhookDtpo);

            const response = await request(app.getHttpServer())
            .patch('/webhooks')
            .send({ 
                id: createdWebhook.id,
                url: 'https://www.lemonde.fr/sport/rss_full.xml'
            });
    
            expect(response.statusCode >= 300).toBeFalsy();
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