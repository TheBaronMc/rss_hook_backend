import { PrismaService } from './prisma.service';
import { DeliveryService } from './deliveries.service'

describe('Delevery service test', () => {
    let prisma = new PrismaService();
    let deliveryService = new DeliveryService(prisma);

    beforeEach(async () => {
        await prisma.deliveries.deleteMany();
        await prisma.articles.deleteMany();
        await prisma.deliveries.deleteMany();
        await prisma.webhooks.deleteMany();
    });

    afterAll(async () => {
        await prisma.deliveries.deleteMany();
        await prisma.articles.deleteMany();
        await prisma.deliveries.deleteMany();
        await prisma.webhooks.deleteMany();
    });

    it('Create delivery', async () => {
        expect(await prisma.deliveries.count()).toEqual(0);

        let flux = await prisma.flux.create({ data: { url: 'url'} });
        let article = await prisma.articles.create({ data: { title: 'article', sourceId: flux.id } });
        let webhook = await prisma.webhooks.create({ data: { url: 'url' } });

        expect(await deliveryService.createDelevery(999, 999)).toBeFalsy();
        expect(await deliveryService.createDelevery(999, article.id)).toBeFalsy();
        expect(await deliveryService.createDelevery(webhook.id, 999)).toBeFalsy();
        expect(await deliveryService.createDelevery(webhook.id, article.id)).toBeTruthy();

        let deliveries = await prisma.deliveries.findMany();
        expect(deliveries.length).toEqual(1);

        expect(deliveries[0].contentId).toEqual(article.id);
        expect(deliveries[0].receiverId).toEqual(webhook.id);
    });

    it('Delete delivery', async () => {
        let flux = await prisma.flux.create({ data: { url: 'url'} });
        let article = await prisma.articles.create({ data: { title: 'article', sourceId: flux.id } });
        let webhook = await prisma.webhooks.create({ data: { url: 'url' } });

        await prisma.deliveries.create({
            data: {
                contentId: article.id,
                receiverId: webhook.id
            }
        })

        expect(await prisma.deliveries.count()).toEqual(1);

        expect(await deliveryService.deleteDelevery(999, 999)).toBeFalsy();
        expect(await deliveryService.deleteDelevery(999, article.id)).toBeFalsy();
        expect(await deliveryService.deleteDelevery(webhook.id, 999)).toBeFalsy();
        expect(await deliveryService.deleteDelevery(webhook.id, article.id)).toBeTruthy();

        expect(await prisma.deliveries.count()).toEqual(0);
    });

    it('Delete deliveries to a webhook', async () => {
        let flux = await prisma.flux.create({ data: { url: 'url'} });
        let webhook1 = await prisma.webhooks.create({ data: { url: 'url' } });
        let webhook2 = await prisma.webhooks.create({ data: { url: 'url' } });

        for (let i=0; i<10; i++) {
            let article = await prisma.articles.create({ data: { title: 'article', sourceId: flux.id } });
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
        
        for (let delivery of (await prisma.deliveries.findMany()))
            expect(delivery.receiverId).toEqual(webhook1.id);
    });

    it('Delete deliveries of an article', async () => {
        let flux = await prisma.flux.create({ data: { url: 'url'} });
        let article1 = await prisma.articles.create({ data: { title: 'article', sourceId: flux.id } });
        let article2 = await prisma.articles.create({ data: { title: 'article', sourceId: flux.id } });

        for (let i=0; i<10; i++) {
            let webhook = await prisma.webhooks.create({ data: { url: 'url' } });
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
        
        for (let delivery of (await prisma.deliveries.findMany()))
            expect(delivery.contentId).toEqual(article1.id);
    });

    it('Get deliveries received by a webhook', async () => {
        let flux = await prisma.flux.create({ data: { url: 'url'} });
        let webhook1 = await prisma.webhooks.create({ data: { url: 'url' } });
        let webhook2 = await prisma.webhooks.create({ data: { url: 'url' } });

        for (let i=0; i<10; i++) {
            let article = await prisma.articles.create({ data: { title: 'article', sourceId: flux.id } });
            await prisma.deliveries.create({
                data: {
                    contentId: article.id,
                    receiverId: (i%2 == 0) ? webhook1.id : webhook2.id
                }
            });
        }

        expect(await prisma.deliveries.count()).toEqual(10);

        for (let id of [webhook1.id, webhook2.id]) {
            let deliveriesWebhook = await deliveryService.getDelevriesTo(id);

            expect(deliveriesWebhook.length).toEqual(5);
        }
    });

    it('Get deliveries of an article', async () => {
        let flux = await prisma.flux.create({ data: { url: 'url'} });
        let article1 = await prisma.articles.create({ data: { title: 'article', sourceId: flux.id } });
        let article2 = await prisma.articles.create({ data: { title: 'article', sourceId: flux.id } });

        for (let i=0; i<10; i++) {
            let webhook = await prisma.webhooks.create({ data: { url: 'url' } });
            await prisma.deliveries.create({
                data: {
                    contentId: (i%2 == 0) ? article1.id : article2.id,
                    receiverId: webhook.id
                }
            });
        }

        expect(await prisma.deliveries.count()).toEqual(10);

        for (let id of [article1.id, article2.id]) {
            let deliveriesWebhook = await deliveryService.getDelevriesOf(id);

            expect(deliveriesWebhook.length).toEqual(5);
        }
    });

});