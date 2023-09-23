import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { AppModule } from './app.module';
import { PrismaService } from '../services';
import { INestApplication } from '@nestjs/common';

import { IncomingMessage, Server, ServerResponse, createServer } from 'http';

type Article = {
    title: string,
    description: string,
    url: string,
    date: Date
};

abstract class Closeable {
    private static closeables: Closeable[] = [];

    private port: number;

    constructor(port: number) {
        Closeable.closeables.push(this);
        this.port = port;
    }

    public static async closeAll(): Promise<void> {
        await Promise.all(this.closeables.map(closeable => closeable.close()));
    }

    public getUrl(): string {
        return `http://localhost:${this.port}/`;
    }

    public abstract close(): Promise<void>;

    public abstract isClosed(): boolean;
}

class RssFlux extends Closeable {
    articles: Article[];
    server: Server;
    newItemProcess: NodeJS.Timer;
    closed: boolean;

    constructor(port: number) {
        super(port);
        this.articles = [];
        this.server = createServer(this.requestHandler.bind(this));
        this.server.listen(port);
        this.newArticle(this.articles);

        this.newItemProcess = setInterval(this.newArticle, 1000, this.articles);

        this.closed = false;
        this.server.on('close', () => this.closed = true);
    }

    public isClosed(): boolean {
        return this.closed;
    }

    public newArticle(articles: Article[]): void {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        let title = '';
        let counter = 0;
        while (counter < 15) {
            title += characters.charAt(Math.floor(Math.random() * charactersLength));
            counter += 1;
        }

        articles.push({
            title,
            description: "A description",
            url: 'http://toto.fr',
            date: new Date()
        });
    }

    public close(): Promise<void> {
        clearInterval(this.newItemProcess);
        this.server.close();
        return;
    }

    private articlesToString(): string {
        return this.articles.reverse().reduce((accum, article) => {
            const date = article.date;

            // Get date components
            const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getUTCDay()];
            const day = date.getUTCDate();
            const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getUTCMonth()];
            const year = date.getUTCFullYear();
            const hours = String(date.getUTCHours()).padStart(2, '0');
            const minutes = String(date.getUTCMinutes()).padStart(2, '0');
            const seconds = String(date.getUTCSeconds()).padStart(2, '0');
            const timeZone = '+0200';

            // Create the formatted date string
            const formattedDate = `${dayOfWeek}, ${day} ${month} ${year} ${hours}:${minutes}:${seconds} ${timeZone}`;

            return accum + `<item>
            <title>${article.title}</title>
            <description>${article.description}</description>
            <link>${article.url}</link>
            <guid>${article.title}</guid>
            <pubDate>${formattedDate}</pubDate>
            </item>`;
        }, "");
    }

    private requestHandler(request: IncomingMessage,response: ServerResponse): void {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        response.writeHead(200, { 'Content-Type': 'application/rss+xml'});
        response.write(`<rss version="2.0">
        <channel>
        <title>Test Feed</title>
        <link>http://toto.fr/</link>
        <description>A RSS news feed for tests</description>
        <language>en-us</language>
        <docs>https://www.rssboard.org/rss-specification</docs>
        <managingEditor>manager@toto.fr</managingEditor>
        <webMaster>admin@toto.fr</webMaster>
        <atom:link href="https://www.rssboard.org/files/sample-rss-2.xml" rel="self" type="application/rss+xml"/>`
        + this.articlesToString() +
        `</channel>
        </rss>`);
        response.end();
    }
}

class Webhook extends Closeable {
    server: Server;
    recievedArticles: Article[] = [];
    closed: boolean;

    constructor(port: number) {
        super(port);
        this.server = createServer(this.requestHandler);
        this.server.listen(port);

        this.closed = false;
        this.server.on('close', () => this.closed = true);
    }

    public close(): Promise<void> {
        this.server.close();
        return;
    }

    private requestHandler(request,response): void {
        response.end();
    }

    public isClosed(): boolean {
        return this.closed;
    }
}

async function fetchArticles(app: INestApplication): Promise<any[]> {
    const response = await request(app.getHttpServer())
    .get('/articles')
    .send();

    if (response.statusCode >= 300) {
        throw new Error('Unable to fetch articles');
    }

    return response.body;
}

function contains(list: any[], element: any): boolean {
    return list.some(value => value.id == element.id);
}

async function waitForNewArticle(app: INestApplication, limitMs: number): Promise<any[]> {
    const startTime = new Date();

    const newArticles: any[] = [];
    const articlesBeforeWait = await fetchArticles(app);
    while ((new Date().getTime() - startTime.getTime()) <= limitMs 
            && (newArticles.length == 0)) {
        const articles = await fetchArticles(app);
        for (const article of articles) {
            if (!contains(articlesBeforeWait,article)) {
                newArticles.push(article);
            }
        }
    }
    
    if (newArticles.length == 0) {
        throw new Error('No new article observed');
    }

    return newArticles;
}

describe('Application Integration Tests', () => {
    let app: INestApplication;

    let prismaService: PrismaService;

    beforeEach(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        prismaService = moduleRef.get<PrismaService>(PrismaService);

        app = moduleRef.createNestApplication();
        await app.init();

        await prismaService.deliveries.deleteMany();
        await prismaService.articles.deleteMany();
        await prismaService.bindings.deleteMany();
        await prismaService.webhooks.deleteMany();
        await prismaService.flux.deleteMany();
    });

    afterEach(async () => {
        await prismaService.deliveries.deleteMany();
        await prismaService.articles.deleteMany();
        await prismaService.bindings.deleteMany();
        await prismaService.webhooks.deleteMany();
        await prismaService.flux.deleteMany();

        await app.close();
        await Closeable.closeAll();
    });

    afterAll(async () => {
        await prismaService.deliveries.deleteMany();
        await prismaService.articles.deleteMany();
        await prismaService.bindings.deleteMany();
        await prismaService.webhooks.deleteMany();
        await prismaService.flux.deleteMany();

        await app.close();
        await Closeable.closeAll();
    });

    /**
     * Scenario 1
     * 
     * Insert a rss flux and a webhook
     * Bind them together
     * Finaly see the deliveries the deliveries
     * 
     */
    it('Scenario 1: One flux, One webhook', async () => {
        const aRssFlux = new RssFlux(10000);
        const aWebhook = new Webhook(10001);

        // Add a flux
        const postFluxResponse = await request(app.getHttpServer())
        .post('/flux')
        .send({ url: aRssFlux.getUrl() });

        expect(postFluxResponse.statusCode < 300).toBeTruthy();
        const fluxId = postFluxResponse.body.id;
        
        // Add a webhook
        const postWebhookResponse = await request(app.getHttpServer())
        .post('/webhooks')
        .send({ url: aWebhook.getUrl() });

        expect(postWebhookResponse.statusCode < 300).toBeTruthy();
        const webhookId = postWebhookResponse.body.id;

        // wait and see new article
        const newArticlesBeforeBinding = await waitForNewArticle(app, 10000);

        // see deliveries
        const whArtBefBindResp = await request(app.getHttpServer())
        .get(`/deliveries/webhooks/${webhookId}`)
        .send();

        expect(newArticlesBeforeBinding.reduce((accum, article) => {
            return accum && !contains(whArtBefBindResp.body, article);
        }, true))
        .toBeTruthy();

        // Bind flux and webhook
        await request(app.getHttpServer())
        .post('/bindings')
        .send({ 
            fluxId,
            webhookId
        });

        // wait new article
        const newArticlesDuringBinding = await waitForNewArticle(app, 10000);

        // see deliveries
        const whArtDurBindResp = await request(app.getHttpServer())
        .get(`/deliveries/webhooks/${webhookId}`)
        .send();

        expect(newArticlesDuringBinding.reduce((accum, article) => {
            return accum && contains(whArtDurBindResp.body, article);
        }, true))
        .toBeTruthy();


        // remove binding
        await request(app.getHttpServer())
        .delete('/bindings')
        .send({ 
            fluxId,
            webhookId
        });

        // wait new article
        const newArticlesAfterBinding = await waitForNewArticle(app, 10000);

        // see deliveries
        const whArtAftBindResp = await request(app.getHttpServer())
        .get(`/deliveries/webhooks/${webhookId}`)
        .send();

        expect(newArticlesAfterBinding.reduce((accum, article) => {
            return accum && !contains(whArtAftBindResp.body, article);
        }, true))
        .toBeTruthy();
        
        await Closeable.closeAll();
    });
});