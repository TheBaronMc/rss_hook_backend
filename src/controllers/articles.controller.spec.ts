import { Test, TestingModule } from '@nestjs/testing';

import { ArticleController } from './articles.controller';
import { ArticleService, FluxService, PrismaService } from '../services';
import { GetArticleDto } from '../dataTranferObjects/article.dto';

describe('Article Controller', () => {
    let articleController: ArticleController;

    let prismaService: PrismaService;
    let articleService: ArticleService;
    let fluxService: FluxService;

    let app: TestingModule;
    
    beforeAll(async () => {
        app = await Test.createTestingModule({
            controllers: [ArticleController],
            providers: [ArticleService, PrismaService],
        }).compile();

        prismaService = app.get<PrismaService>(PrismaService);
        articleService = app.get<ArticleService>(ArticleService);

        articleController = app.get<ArticleController>(ArticleController);

        fluxService = new FluxService(prismaService);
    });

    beforeEach(async () => {
        await prismaService.articles.deleteMany();
        await prismaService.flux.deleteMany();
    });

    afterAll(async () => {
        await prismaService.articles.deleteMany();
        await prismaService.flux.deleteMany();
    });

    describe('getAll', () => {
        beforeEach(async () => {
            await prismaService.articles.deleteMany();
            await prismaService.flux.deleteMany();
        });

        it('Zero article', async () => {
            expect(await articleController.getAll())
            .toEqual(await articleService.getArticles());
        });

        it('One article', async () => {
            const flux = await fluxService.createFlux('url');

            await articleService.createArticle('article', flux.id);

            expect(await articleController.getAll())
            .toEqual(await articleService.getArticles());
        });

        it('Two article', async () => {
            const flux = await fluxService.createFlux('url');

            await articleService.createArticle('article1', flux.id);
            await articleService.createArticle('article2', flux.id);

            expect(await articleController.getAll())
            .toEqual(await articleService.getArticles());
        });
    });

    describe('getAllByFlux', () => {
        beforeEach(async () => {
            await prismaService.articles.deleteMany();
            await prismaService.flux.deleteMany();
        });

        it('Zero article', async () => {
            const aFluxId = 1;

            const getArticleDto = new GetArticleDto();
            getArticleDto.id = aFluxId;

            expect(await articleController.getAllByFlux(getArticleDto))
            .toEqual([]);
        });

        it('One article', async () => {
            const aFlux = await fluxService.createFlux('url');

            await articleService.createArticle('article', aFlux.id);

            const getArticleDto = new GetArticleDto();
            getArticleDto.id = aFlux.id;

            expect(await articleController.getAllByFlux(getArticleDto))
            .toEqual(await articleService.getArticlesSendedBy(aFlux.id));
        });

        it('Two article', async () => {
            const aFlux = await fluxService.createFlux('url');

            await articleService.createArticle('article1', aFlux.id);
            await articleService.createArticle('article2', aFlux.id);

            const getArticleDto = new GetArticleDto();
            getArticleDto.id = aFlux.id;

            expect(await articleController.getAllByFlux(getArticleDto))
            .toEqual(await articleService.getArticlesSendedBy(aFlux.id));
        });
    });
});