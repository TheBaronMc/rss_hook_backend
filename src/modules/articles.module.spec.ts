import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { ArticlesModule } from './articles.module';
import { FluxService, ArticleService, PrismaService } from '../services';
import { INestApplication } from '@nestjs/common';
import { Articles } from '@prisma/client';

function includes(array: any[], article: Articles): boolean {
    return array.some((value) => {
        return value.id == article.id;
    });
}

describe('Artcile Module', () => {
    let app: INestApplication;

    let prismaService: PrismaService;
    let fluxService: FluxService;
    let articleService: ArticleService;

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [ArticlesModule],
        }).compile();

        articleService = moduleRef.get<ArticleService>(ArticleService);
        prismaService = moduleRef.get<PrismaService>(PrismaService);

        fluxService = new FluxService(prismaService);

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

    describe('GET /articles', () => {
        it('Empty list', () => {
            return request(app.getHttpServer())
              .get('/articles')
              .expect([]);
        });

        it('One article', async () => {
            const aFlux = await fluxService.createFlux('url');

            const anArticle = await articleService.createArticle('aTitle', aFlux.id);

            const response = await request(app.getHttpServer())
            .get('/articles');

            expect(includes(response.body,anArticle)).toBeTruthy();
        });

        it('Two articles', async () => {
            const aFlux = await fluxService.createFlux('url');

            const firstArticle = await articleService.createArticle('aTitle', aFlux.id);
            const secondArticle = await articleService.createArticle('anotherTitle', aFlux.id);

            const response = await request(app.getHttpServer())
            .get('/articles');

            expect(includes(response.body,firstArticle)).toBeTruthy();
            expect(includes(response.body,secondArticle)).toBeTruthy();
        });

        it('One article from flux', async () => {
            const firstFlux = await fluxService.createFlux('firstUrl');
            const articleFromFirstFlux = await articleService.createArticle('aTitle', firstFlux.id);

            const secondFlux = await fluxService.createFlux('secondUrl');
            const articleFromSecondFlux = await articleService.createArticle('anotherTitle', secondFlux.id);

            const response = await request(app.getHttpServer())
            .get('/articles');

            expect(includes(response.body,articleFromFirstFlux)).toBeTruthy();
            expect(includes(response.body,articleFromSecondFlux)).toBeTruthy();
        });
    });

    describe('GET /articles/flux/:id', () => {
        it('Wrong id 1', () => {
            return request(app.getHttpServer())
              .get('/articles/flux/1')
              .expect([]);
        });

        it('Wrong id 2', async () => {
            const response = await request(app.getHttpServer())
              .get('/articles/flux/abc');

            expect(response.body.statusCode >= 300).toBeTruthy();
        });

        it('Wrong id 3', async () => {
            const response = await request(app.getHttpServer())
              .get('/articles/flux/');

            expect(response.body.statusCode >= 300).toBeTruthy();
        });

        it('One article', async () => {
            const aFlux = await fluxService.createFlux('url');

            const anArticle = await articleService.createArticle('aTitle', aFlux.id);

            const response = await request(app.getHttpServer())
            .get(`/articles/flux/${aFlux.id}`);
            
            expect(includes(response.body,anArticle)).toBeTruthy();
        });

        it('Two articles', async () => {
            const aFlux = await fluxService.createFlux('url');

            const firstArticle = await articleService.createArticle('aTitle', aFlux.id);
            const secondArticle = await articleService.createArticle('anotherTitle', aFlux.id);

            const response = await request(app.getHttpServer())
            .get(`/articles/flux/${aFlux.id}`);

            expect(includes(response.body,firstArticle)).toBeTruthy();
            expect(includes(response.body,secondArticle)).toBeTruthy();
        });

        it('One article from flux', async () => {
            const firstFlux = await fluxService.createFlux('firstUrl');
            const articleFromFirstFlux = await articleService.createArticle('aTitle', firstFlux.id);

            const secondFlux = await fluxService.createFlux('secondUrl');
            const articleFromSecondFlux = await articleService.createArticle('anotherTitle', secondFlux.id);

            const response = await request(app.getHttpServer())
            .get(`/articles/flux/${firstFlux.id}`);

            expect(includes(response.body,articleFromFirstFlux)).toBeTruthy();
            expect(includes(response.body,articleFromSecondFlux)).toBeFalsy();
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