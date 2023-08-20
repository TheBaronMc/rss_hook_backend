import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { FluxModule } from './flux.module';
import { FluxService } from '../services/flux.service';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../services';
import { FluxController } from '../controllers';
import { CreateFluxDto } from '../dataTranferObjects/flux.dto';

describe('FluxModule', () => {
    let app: INestApplication;

    let fluxService: FluxService;
    let fluxController: FluxController;
    let prismaService: PrismaService;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [FluxModule],
        }).compile();

        fluxService = moduleRef.get<FluxService>(FluxService);
        prismaService = moduleRef.get<PrismaService>(PrismaService);
        fluxController = moduleRef.get<FluxController>(FluxController);

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

    describe('POST /flux', () => {
        it('Missing url', async () => {
            const response = await request(app.getHttpServer())
            .post('/flux')
            .send({ });
    
            expect(response.statusCode).not.toEqual(200);
        });

        it('Not flux', async () => {
            const response = await request(app.getHttpServer())
            .post('/flux')
            .send({ url: 'abcde124' });
    
            expect(response.statusCode).not.toEqual(200);
        });

        it('Bad flux', async () => {
            const response = await request(app.getHttpServer())
            .post('/flux')
            .send({ url: 'http://toto.fr' });
    
            expect(response.statusCode).not.toEqual(200);
        });
    
        it('Good flux', async () => {
            const response = await request(app.getHttpServer())
            .post('/flux')
            .send({ url: 'https://www.lemonde.fr/sport/rss_full.xml' });
    
            expect(response.body.url).toEqual('https://www.lemonde.fr/sport/rss_full.xml');
        });
    });

    describe('GET /flux', () => {
        it('Zero flux', async () => {
            const response = await request(app.getHttpServer())
            .get('/flux');
    
            expect(response.body.length).toEqual(0);
        });

        it('One flux', async () => {
            await fluxService.createFlux('https://www.lemonde.fr/sport/rss_full.xml');
            
            const response = await request(app.getHttpServer())
            .get('/flux');
    
            expect(response.body.length).toEqual(1);
        });
    });

    describe('GET /flux/:id', () => {
        it('Wrong id - 1', async () => {
            const response = await request(app.getHttpServer())
            .get('/flux/abc');
    
            expect(response.statusCode >= 300).toBeTruthy();
        });

        it('Wrong id - 2', async () => {
            const response = await request(app.getHttpServer())
            .get('/flux/-1');
    
            expect(response.statusCode >= 300).toBeTruthy();
        });

        it('Zero flux', async () => {
            const response = await request(app.getHttpServer())
            .get('/flux/1');
    
            expect(response.statusCode >= 300).toBeTruthy();
        });

        it('One flux', async () => {
            const aUrl = 'https://www.lemonde.fr/sport/rss_full.xml';
            const createdFlux = await fluxService.createFlux(aUrl);
            
            const response = await request(app.getHttpServer())
            .get(`/flux/${createdFlux.id}`);
    
            expect(response.statusCode >= 300).toBeFalsy();

            expect(response.body.id).toEqual(createdFlux.id);
            expect(response.body.url).toEqual(aUrl);
        });
    });

    describe('DELTE /flux', () => {
        it('Missing id', async () => {
            const response = await request(app.getHttpServer())
            .delete('/flux')
            .send({ });
    
            expect(response.statusCode).not.toEqual(200);
        });

        it('Wrong id - 1', async () => {
            const response = await request(app.getHttpServer())
            .delete('/flux')
            .send({ id: 1 });
    
            expect(response.statusCode).not.toEqual(200);
        });

        it('Wrong id - 2', async () => {
            const response = await request(app.getHttpServer())
            .delete('/flux')
            .send({ id: 'abc' });
    
            expect(response.statusCode).not.toEqual(200);
        });

        it('Good id', async () => {
            const createdFlux = await fluxService.createFlux('https://www.lemonde.fr/sport/rss_full.xml');

            expect((await fluxService.getAllFlux()).length)
            .toEqual(1);

            const response = await request(app.getHttpServer())
            .delete('/flux')
            .send({ id: createdFlux.id });
    
            expect(response.statusCode >= 300).toBeFalsy();
            expect((await fluxService.getAllFlux()).length)
            .toEqual(0);
        });
    });

    describe('PATCH /flux', () => {
        it('Missing arguments', async () => {
            const response = await request(app.getHttpServer())
            .patch('/flux')
            .send({ });
    
            expect(response.statusCode >= 300).toBeTruthy();
        });

        it('Missing id', async () => {
            const response = await request(app.getHttpServer())
            .patch('/flux')
            .send({ 
                url: 'https://www.lemonde.fr/sport/rss_full.xml'
            });
    
            expect(response.statusCode >= 300).toBeTruthy();
        });

        it('Missing url', async () => {
            const response = await request(app.getHttpServer())
            .patch('/flux')
            .send({ 
                id: 1
            });
    
            expect(response.statusCode >= 300).toBeTruthy();
        });

        it('Wrong id - 1', async () => {
            const response = await request(app.getHttpServer())
            .patch('/flux')
            .send({ 
                id: 1,
                url: 'https://www.lemonde.fr/sport/rss_full.xml'
            });
    
            expect(response.statusCode >= 300).toBeTruthy();
        });

        it('Wrong id - 2', async () => {
            const response = await request(app.getHttpServer())
            .patch('/flux')
            .send({ 
                id: 'abc',
                url: 'https://www.lemonde.fr/sport/rss_full.xml'
            });
    
            expect(response.statusCode >= 300).toBeTruthy();
        });

        it('Bad url', async () => {
            const aCreateFluxDtpo = new CreateFluxDto();
            aCreateFluxDtpo.url = 'https://www.lemonde.fr/sport/rss_full.xml';
            const createdFlux = await fluxController.create(aCreateFluxDtpo);

            const response = await request(app.getHttpServer())
            .patch('/flux')
            .send({ 
                id: createdFlux.id,
                url: 'abc'
            });
    
            expect(response.statusCode >= 300).toBeTruthy();
        });

        /*
        it('Url is not a flux', async () => {
            const aCreateFluxDtpo = new CreateFluxDto();
            aCreateFluxDtpo.url = 'https://www.lemonde.fr/sport/rss_full.xml';
            const createdFlux = await fluxController.create(aCreateFluxDtpo);

            const response = await request(app.getHttpServer())
            .patch('/flux')
            .send({ 
                id: createdFlux.id,
                url: 'http://toto.fr'
            });
    
            expect(response.statusCode >= 300).toBeTruthy();
        });
        */

        it('Good', async () => {
            const aCreateFluxDtpo = new CreateFluxDto();
            aCreateFluxDtpo.url = 'https://www.lemonde.fr/sport/rss_full.xml';
            const createdFlux = await fluxController.create(aCreateFluxDtpo);

            const response = await request(app.getHttpServer())
            .patch('/flux')
            .send({ 
                id: createdFlux.id,
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