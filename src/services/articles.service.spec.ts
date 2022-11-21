import { PrismaService } from './prisma.service';
import { ArticleService } from './articles.service'

describe('Article service test', () => {
    let prisma = new PrismaService();
    let articleService = new ArticleService(prisma);

    beforeEach(async () => {
        await prisma.articles.deleteMany();
        await prisma.flux.deleteMany();
    });

    afterAll(async () => {
        await prisma.articles.deleteMany();
        await prisma.flux.deleteMany();
    });

    it('Create article', async () => {
        const articleInfo = {
            title: 'Toto',
            description: 'Great story!',
            url: 'url'
        }

        let articles = await prisma.articles.findMany();
        expect(articles.length).toEqual(0);

        let flux = await prisma.flux.create({
            data: {
                url: 'flux'
            }
        });
        await articleService.createArticle(articleInfo.title, flux.id, articleInfo.description, articleInfo.url);

        articles = await prisma.articles.findMany();
        expect(articles.length).toEqual(1);

        expect(articles[0].title).toEqual(articleInfo.title);
        expect(articles[0].description).toEqual(articleInfo.description);
        expect(articles[0].url).toEqual(articleInfo.url);
        expect(articles[0].sourceId).toEqual(flux.id);
    });

    it('Get all articles', async () => {
        let flux = await prisma.flux.create({
            data: {
                url: 'flux'
            }
        });

        let articles = await articleService.getArticles();
        expect(articles.length).toEqual(0);

        for (let i = 1; i<10; i++) {
            await prisma.articles.create({
                data: {
                    title: 'toto',
                    description: 'Great story!',
                    url: 'url',
                    sourceId: flux.id
                }
            });
            articles = await articleService.getArticles();
            expect(articles.length).toEqual(i);
        }
            
    });

    it('Get all articles', async () => {
        let flux1 = await prisma.flux.create({
            data: {
                url: 'flux1'
            }
        });
        let flux2 = await prisma.flux.create({
            data: {
                url: 'flux2'
            }
        });

        let coin = true
        for (let i = 0; i<10; i++) {
            await prisma.articles.create({
                data: {
                    title: 'toto',
                    description: 'Great story!',
                    url: 'url',
                    sourceId: coin ? flux1.id : flux2.id
                }
            });
            coin = coin ? false : true;
        }

        let articles_flux1 = await articleService.getArticlesSendedBy(flux1.id);
        expect(articles_flux1.length).toEqual(5);
        for (let article of articles_flux1)
            expect(article.sourceId).toEqual(flux1.id);
        
        let articles_flux2 = await articleService.getArticlesSendedBy(flux2.id);
        expect(articles_flux2.length).toEqual(5);
        for (let article of articles_flux2)
            expect(article.sourceId).toEqual(flux2.id)
    });

    it('Delete article', async () => {
        let flux = await prisma.flux.create({
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

        let articles = await prisma.articles.findMany();
        expect(articles.length).toEqual(1);

        await articleService.deleteArticle(articles[0].id);

        articles = await prisma.articles.findMany();
        expect(articles.length).toEqual(0);
    });

});