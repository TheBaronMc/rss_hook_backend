import { PrismaService } from './prisma.service';
import { WebhooksService } from './webhooks.service'

describe('Webhooks service test', () => {
    let prisma = new PrismaService();
    let webhooksService = new WebhooksService(prisma);

    beforeEach(async () => {
        await prisma.webhooks.deleteMany();
    });

    afterAll(async () => {
        await prisma.webhooks.deleteMany();
    });

    it('Create a webhook', async () => {
        for (let i=1; i<=10; i++) {
            let url = `url${i}`
            let created_webhook = await webhooksService.createWebhook(url);

            // Returns the created object in the database
            expect(created_webhook.url).toEqual(url);
            expect((await prisma.webhooks.findFirst({
                where: { id: created_webhook.id }
             })).url).toEqual(url);
            
            let webhooks = await prisma.webhooks.findMany();

            expect(webhooks.length).toEqual(i);
            expect(webhooks.filter(wh => wh.url == url).length).toEqual(1);
        }
    });

    it('Get all webhooks', async () => {
        let urls: Array<string> = [];

        // Add webhooks to the db
        for (let i=1; i<=10; i++) {
            let url = `url${i}`
            urls.push(url);
            await prisma.webhooks.create({
                data: { url }
            });
        }

        // Retrieve all the webhooks from the db
        let webhooks = await webhooksService.getAllWebhooks();

        // Check the number of webhook
        expect(webhooks.length).toEqual(10);

        // Check if a webhook haven't been added twice
        expect(webhooks.every((webhook) => {
            return urls.includes(webhook.url) && webhooks.reduce((accum, wh) => {
                return wh.url == webhook.url ? accum + 1 : accum
            }, 0) == 1
        })).toBeTruthy();
    });

    it('Delete webhook', async () => {
        await prisma.webhooks.create({
            data: { url: 'url' }
        });

        let webhooks = await prisma.webhooks.findMany();
        expect(webhooks.length).toEqual(1);

        await webhooksService.deleteWebhook(webhooks[0].id);
        expect((await prisma.webhooks.findMany()).length).toEqual(0);
    });

    it('Update webhook', async () => {
        const FIRST_URL = 'url1';
        const SECOND_URL = 'url2';

        // Create the webhook
        await prisma.webhooks.create({
            data: { url: FIRST_URL }
        });

        let webhooks = await prisma.webhooks.findMany();
        expect(webhooks[0].url).toEqual(FIRST_URL);

        // Update the webhook url value
        await webhooksService.updateWebhook(webhooks[0].id, SECOND_URL);
        expect((await prisma.webhooks.findMany())[0].url).toEqual(SECOND_URL);
    });

});