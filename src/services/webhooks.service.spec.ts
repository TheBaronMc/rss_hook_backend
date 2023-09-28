import { NotFoundError } from '@prisma/client/runtime';
import { PrismaService } from './prisma.service';
import { WebhooksService } from './webhooks.service';

describe('Webhooks service test', () => {
    const prisma = new PrismaService();
    const webhooksService = new WebhooksService(prisma);

    beforeEach(async () => {
        await prisma.webhooks.deleteMany();
    });

    afterAll(async () => {
        await prisma.webhooks.deleteMany();
    });

    it('Create a webhook', async () => {
        for (let i=1; i<=10; i++) {
            const url = `url${i}`;
            const createdWebhook = await webhooksService.createWebhook(url);

            // Returns the created object in the database
            expect(createdWebhook.url).toEqual(url);
            expect((await prisma.webhooks.findFirst({
                where: { id: createdWebhook.id }
             })).url).toEqual(url);
            
             const webhooks = await prisma.webhooks.findMany();

            expect(webhooks.length).toEqual(i);
            expect(webhooks.filter(wh => wh.url == url).length).toEqual(1);
        }
    });

    describe('Get', () => {
        it('Unkown id', async () => {
            await expect(webhooksService.getWebhook(1))
            .rejects
            .toThrow(NotFoundError);
        });

        it('Kown id', async () => {
            const aUrl = 'url';

            const createdWebhook = await prisma.webhooks.create({
                data: { url: aUrl }
            });

            const aWebhook = await webhooksService.getWebhook(createdWebhook.id);
            expect(aWebhook).toEqual(createdWebhook);
        });
    });

    it('Get all webhooks', async () => {
        const urls: Array<string> = [];

        // Add webhooks to the db
        for (let i=1; i<=10; i++) {
            const url = `url${i}`;
            urls.push(url);
            await prisma.webhooks.create({
                data: { url }
            });
        }

        // Retrieve all the webhooks from the db
        const webhooks = await webhooksService.getAllWebhooks();

        // Check the number of webhook
        expect(webhooks.length).toEqual(10);

        // Check if a webhook haven't been added twice
        expect(webhooks.every((webhook) => {
            return urls.includes(webhook.url) && webhooks.reduce((accum, wh) => {
                return wh.url == webhook.url ? accum + 1 : accum;
            }, 0) == 1;
        })).toBeTruthy();
    });

    it('Delete webhook', async () => {
        await prisma.webhooks.create({
            data: { url: 'url' }
        });

        const webhooks = await prisma.webhooks.findMany();
        expect(webhooks.length).toEqual(1);

        await webhooksService.deleteWebhook(webhooks[0].id);
        expect((await prisma.webhooks.findMany()).length).toEqual(0);
    });

    it('Update webhook', async () => {
        const firstUrl = 'url1';
        const secondUrl = 'url2';

        // Create the webhook
        await prisma.webhooks.create({
            data: { url: firstUrl }
        });

        const webhooks = await prisma.webhooks.findMany();
        expect(webhooks[0].url).toEqual(firstUrl);

        // Update the webhook url value
        await webhooksService.updateWebhook(webhooks[0].id, secondUrl);
        expect((await prisma.webhooks.findMany())[0].url).toEqual(secondUrl);
    });

});