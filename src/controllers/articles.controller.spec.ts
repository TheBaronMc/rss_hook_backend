import { Test, TestingModule } from '@nestjs/testing';
import { ArticleController } from './articles.controller'
import { ArticleService, FluxService, PrismaService } from '../services'
import { Request } from 'express';
import { HttpException } from '@nestjs/common';

describe('Article Controller', () => {
    let articleController: ArticleController;

    let prismaService = new PrismaService();
    let articleService = new ArticleService(prismaService);
    let fluxService = new FluxService(prismaService);

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({
            controllers: [ArticleController],
            providers: [ArticleService, PrismaService],
        }).compile();

        articleController = app.get<ArticleController>(ArticleController);

        await prismaService.articles.deleteMany();
        await prismaService.flux.deleteMany();
    });

    afterAll(async () => {
        await prismaService.articles.deleteMany();
        await prismaService.flux.deleteMany();
    });

    describe('getAll', () => {
        it('Zero article', async () => {
            expect(await articleController.getAll())
            .toEqual(await articleService.getArticles());
        });

        it('One article', async () => {
            let flux = await fluxService.createFlux('url');

            await articleService.createArticle('article', flux.id);

            expect(await articleController.getAll())
            .toEqual(await articleService.getArticles());
        });

        it('Two article', async () => {
            let flux = await fluxService.createFlux('url');

            await articleService.createArticle('article1', flux.id);
            await articleService.createArticle('article2', flux.id);

            expect(await articleController.getAll())
            .toEqual(await articleService.getArticles());
        });
    });

    describe('getAllByFlux', () => {
        it('Zero article', async () => {
            let request = {
                query: {
                    id: "0"
                }
            } as unknown as Request

            expect(await articleController.getAllByFlux(request))
            .toEqual(await articleService.getArticlesSendedBy(0));
        });

        it('One article', async () => {
            let flux = await fluxService.createFlux('url');

            await articleService.createArticle('article', flux.id);

            let request = {
                query: {
                    id: flux.id.toString()
                }
            } as unknown as Request

            expect(await articleController.getAllByFlux(request))
            .toEqual(await articleService.getArticlesSendedBy(flux.id));
        });

        it('Two article', async () => {
            let flux = await fluxService.createFlux('url');

            await articleService.createArticle('article1', flux.id);
            await articleService.createArticle('article2', flux.id);

            let request = {
                query: {
                    id: flux.id.toString()
                }
            } as unknown as Request

            expect(await articleController.getAllByFlux(request))
            .toEqual(await articleService.getArticlesSendedBy(flux.id));
        });

        it('Two article', async () => {
            let flux1 = await fluxService.createFlux('url');
            let flux2 = await fluxService.createFlux('url');

            await articleService.createArticle('article1', flux1.id);
            await articleService.createArticle('article2', flux1.id);
            await articleService.createArticle('article2', flux2.id);

            let request = {
                query: {
                    id: flux1.id.toString()
                }
            } as unknown as Request

            expect(await articleController.getAllByFlux(request))
            .toEqual(await articleService.getArticlesSendedBy(flux1.id));
        });

        it('Wrong id', async () => {
            let request = {
                query: {
                    id: "#0("
                }
            } as unknown as Request

            await expect(articleController.getAllByFlux(request))
            .rejects
            .toThrow(HttpException);
        });
    });

});