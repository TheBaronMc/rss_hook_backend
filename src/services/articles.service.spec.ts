import { PrismaService } from './prisma.service';
import { ArticleService } from './articles.service';

describe('Article service test', () => {
    const prisma = new PrismaService();
    const articleService = new ArticleService(prisma);

    beforeEach(async () => {
        await prisma.articles.deleteMany();
        await prisma.flux.deleteMany();
    });

    afterAll(async () => {
        await prisma.articles.deleteMany();
        await prisma.flux.deleteMany();
    });

    it('Create article', async () => {
        const anArticle = {
            title: 'Toto',
            description: 'Great story!',
            url: 'url'
        };

        const firstArticleList = await prisma.articles.findMany();
        expect(firstArticleList.length).toEqual(0);

        const flux = await prisma.flux.create({
            data: {
                url: 'flux'
            }
        });
        await articleService.createArticle(anArticle.title, flux.id, anArticle.description, anArticle.url);

        const secondArticleList = await prisma.articles.findMany();
        expect(secondArticleList.length).toEqual(1);

        expect(secondArticleList[0].title).toEqual(anArticle.title);
        expect(secondArticleList[0].description).toEqual(anArticle.description);
        expect(secondArticleList[0].url).toEqual(anArticle.url);
        expect(secondArticleList[0].sourceId).toEqual(flux.id);
    });

    it('Get all articles - single flux', async () => {
        const flux = await prisma.flux.create({
            data: {
                url: 'flux'
            }
        });

        const articleListBeforAdd = await articleService.getArticles();
        expect(articleListBeforAdd.length).toEqual(0);

        const nbArticles = 10;
        const artcileTemplate = {
            description: 'Great story!',
            url: 'url',
            sourceId: flux.id
        };
        const validation = [];
        for (let i = 0; i<nbArticles; i++) {
            await prisma.articles.create({
                data: {
                    title: `${i}`,
                    ...artcileTemplate
                }
            });
            validation.push(false);
        }

        const articleListAfterAdd = await articleService.getArticles();
        expect(articleListAfterAdd.length).toEqual(nbArticles);

        // Verifiy all articles are present
        articleListAfterAdd.forEach(article => {
            validation[parseInt(article.title)] = true;
        });
        expect(validation.reduce((accum, isValidate) => accum && isValidate, true))
        .toBeTruthy();
    });

    it('Get all articles - multiple flux', async () => {
        const firstFlux = await prisma.flux.create({
            data: {
                url: 'flux1'
            }
        });
        const secondFlux = await prisma.flux.create({
            data: {
                url: 'flux2'
            }
        });

        let coin = true;
        for (let i = 0; i<10; i++) {
            await prisma.articles.create({
                data: {
                    title: 'toto',
                    description: 'Great story!',
                    url: 'url',
                    sourceId: coin ? firstFlux.id : secondFlux.id
                }
            });
            coin = !coin;
        }

        const firstFluxArticles = await articleService.getArticlesSendedBy(firstFlux.id);
        expect(firstFluxArticles.length).toEqual(5);
        expect(firstFluxArticles.reduce((accum, article) => accum && (article.sourceId == firstFlux.id), true))
        .toBeTruthy();
        
        const seccondFluxArticles = await articleService.getArticlesSendedBy(secondFlux.id);
        expect(seccondFluxArticles.length).toEqual(5);
        expect(seccondFluxArticles.reduce((accum, article) => accum && (article.sourceId == secondFlux.id), true))
        .toBeTruthy();
    });

    it('Delete article', async () => {
        const flux = await prisma.flux.create({
            data: {
                url: 'flux'
            }
        });
        await prisma.articles.create({
            data: {
                title: 'toto',
                description: 'Great story!',
                url: 'url',
                sourceId: flux.id
            }
        });

        const articleListBeforeDelete = await prisma.articles.findMany();
        expect(articleListBeforeDelete.length).toEqual(1);

        await articleService.deleteArticle(articleListBeforeDelete[0].id);

        const articleListAfterDelete = await prisma.articles.findMany();
        expect(articleListAfterDelete.length).toEqual(0);
    });

});