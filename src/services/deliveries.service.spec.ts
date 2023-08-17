import { PrismaService } from './prisma.service';
import { DeliveryService } from './deliveries.service';

describe('Delevery service test', () => {
    const prisma = new PrismaService();
    const deliveryService = new DeliveryService(prisma);

    beforeEach(async () => {
        await prisma.deliveries.deleteMany();
        await prisma.articles.deleteMany();
        await prisma.deliveries.deleteMany();
        await prisma.flux.deleteMany();
        await prisma.webhooks.deleteMany();
    });

    afterAll(async () => {
        await prisma.deliveries.deleteMany();
        await prisma.articles.deleteMany();
        await prisma.deliveries.deleteMany();
        await prisma.flux.deleteMany();
        await prisma.webhooks.deleteMany();
    });

    it('Create delivery', async () => {
        expect(await prisma.deliveries.count()).toEqual(0);

        const flux = await prisma.flux.create({ data: { url: 'url'} });
        const article = await prisma.articles.create({ data: { title: 'article', sourceId: flux.id } });
        const webhook = await prisma.webhooks.create({ data: { url: 'url' } });

        await expect(deliveryService.createDelevery(999, 999)).rejects.toThrow();
        await expect(deliveryService.createDelevery(999, article.id)).rejects.toThrow();
        await expect(deliveryService.createDelevery(webhook.id, 999)).rejects.toThrow();
        
        const delivery = await deliveryService.createDelevery(webhook.id, article.id);
        expect(delivery.contentId).toEqual(article.id);
        expect(delivery.receiverId).toEqual(webhook.id);

        const deliveries = await prisma.deliveries.findMany();
        expect(deliveries.length).toEqual(1);

        expect(deliveries[0].contentId).toEqual(article.id);
        expect(deliveries[0].receiverId).toEqual(webhook.id);
    });

    it('Delete delivery', async () => {
        const flux = await prisma.flux.create({ data: { url: 'url'} });
        const article = await prisma.articles.create({ data: { title: 'article', sourceId: flux.id } });
        const webhook = await prisma.webhooks.create({ data: { url: 'url' } });

        await prisma.deliveries.create({
            data: {
                contentId: article.id,
                receiverId: webhook.id
            }
        });

        expect(await prisma.deliveries.count()).toEqual(1);

        await expect(deliveryService.deleteDelevery(999, 999)).rejects.toThrow();
        await expect(deliveryService.deleteDelevery(999, article.id)).rejects.toThrow();
        await expect(deliveryService.deleteDelevery(webhook.id, 999)).rejects.toThrow();

        const delivery = await deliveryService.deleteDelevery(webhook.id, article.id);
        expect(delivery.contentId).toEqual(article.id);
        expect(delivery.receiverId).toEqual(webhook.id);

        expect(await prisma.deliveries.count()).toEqual(0);
    });

    it('Delete deliveries to a webhook', async () => {
        const flux = await prisma.flux.create({ data: { url: 'url'} });
        const webhook1 = await prisma.webhooks.create({ data: { url: 'url1' } });
        const webhook2 = await prisma.webhooks.create({ data: { url: 'url2' } });

        for (let i=0; i<10; i++) {
            const article = await prisma.articles.create({ data: { title: 'article', sourceId: flux.id } });
            await prisma.deliveries.create({
                data: {
                    contentId: article.id,
                    receiverId: (i%2 == 0) ? webhook1.id : webhook2.id
                }
            });
        }

        expect(await prisma.deliveries.count()).toEqual(10);

        await deliveryService.deleteDeleveriesTo(webhook2.id);

        expect(await prisma.deliveries.count()).toEqual(5);
        
        for (const delivery of (await prisma.deliveries.findMany()))
            expect(delivery.receiverId).toEqual(webhook1.id);
    });

    it('Delete deliveries of an article', async () => {
        const flux = await prisma.flux.create({ data: { url: 'url'} });
        const article1 = await prisma.articles.create({ data: { title: 'article', sourceId: flux.id } });
        const article2 = await prisma.articles.create({ data: { title: 'article', sourceId: flux.id } });

        for (let i=0; i<10; i++) {
            const webhook = await prisma.webhooks.create({ data: { url: `url${i}` } });
            await prisma.deliveries.create({
                data: {
                    contentId: (i%2 == 0) ? article1.id : article2.id,
                    receiverId: webhook.id
                }
            });
        }

        expect(await prisma.deliveries.count()).toEqual(10);

        await deliveryService.deleteDeleveriesOf(article2.id);

        expect(await prisma.deliveries.count()).toEqual(5);
        
        for (const delivery of (await prisma.deliveries.findMany()))
            expect(delivery.contentId).toEqual(article1.id);
    });

    it('Get deliveries received by a webhook', async () => {
        const flux = await prisma.flux.create({ data: { url: 'url'} });
        const webhook1 = await prisma.webhooks.create({ data: { url: 'url1' } });
        const webhook2 = await prisma.webhooks.create({ data: { url: 'url2' } });

        for (let i=0; i<10; i++) {
            const article = await prisma.articles.create({ data: { title: 'article', sourceId: flux.id } });
            await prisma.deliveries.create({
                data: {
                    contentId: article.id,
                    receiverId: (i%2 == 0) ? webhook1.id : webhook2.id
                }
            });
        }

        expect(await prisma.deliveries.count()).toEqual(10);

        for (const id of [webhook1.id, webhook2.id]) {
            const deliveriesWebhook = await deliveryService.getDelevriesTo(id);

            expect(deliveriesWebhook.length).toEqual(5);
        }
    });

    it('Get deliveries of an article', async () => {
        const flux = await prisma.flux.create({ data: { url: 'url'} });
        const article1 = await prisma.articles.create({ data: { title: 'article', sourceId: flux.id } });
        const article2 = await prisma.articles.create({ data: { title: 'article', sourceId: flux.id } });

        for (let i=0; i<10; i++) {
            const webhook = await prisma.webhooks.create({ data: { url: `url${i}` } });
            await prisma.deliveries.create({
                data: {
                    contentId: (i%2 == 0) ? article1.id : article2.id,
                    receiverId: webhook.id
                }
            });
        }

        expect(await prisma.deliveries.count()).toEqual(10);

        for (const id of [article1.id, article2.id]) {
            const deliveriesWebhook = await deliveryService.getDelevriesOf(id);

            expect(deliveriesWebhook.length).toEqual(5);
        }
    });

});