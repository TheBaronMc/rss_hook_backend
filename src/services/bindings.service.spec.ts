import { PrismaService } from './prisma.service';
import { BindingService } from './bindings.service';

describe('Webbindings service test', () => {
    const prisma = new PrismaService();
    const bindingService = new BindingService(prisma);

    beforeEach(async () => {
        await prisma.bindings.deleteMany();
        await prisma.webhooks.deleteMany();
        await prisma.flux.deleteMany();
    });

    afterAll(async () => {
        await prisma.bindings.deleteMany();
        await prisma.webhooks.deleteMany();
        await prisma.flux.deleteMany();
    });

    it('Create a hook', async () => {
        await expect(bindingService.createBinding(-9999,-9999))
        .rejects
        .toThrow();

        const flux = await prisma.flux.create({ data: { url: 'url' } });

        await expect(bindingService.createBinding(flux.id,-9999))
        .rejects
        .toThrow();

        const webhook = await prisma.webhooks.create({ data: { url: 'url' } });

        await expect(bindingService.createBinding(-9999, webhook.id))
        .rejects
        .toThrow();

        const binding = await bindingService.createBinding(flux.id, webhook.id);
        expect(binding.fluxId).toEqual(flux.id);
        expect(binding.webhookId).toEqual(webhook.id);
    });

    it('Delete a hook', async () => {
        await expect(bindingService.deleteBinding(-9999,-9999))
        .rejects
        .toThrow();

        const flux = await prisma.flux.create({ data: { url: 'url' } });

        await expect(bindingService.deleteBinding(flux.id,-9999))
        .rejects
        .toThrow();

        const webhook = await prisma.webhooks.create({ data: { url: 'url' } });

        await expect(bindingService.deleteBinding(-9999, webhook.id))
        .rejects
        .toThrow();

        await prisma.bindings.create({
            data: {
                fluxId: flux.id,
                webhookId: webhook.id
            }
        });

        const binding = await bindingService.deleteBinding(flux.id, webhook.id);
        expect(binding.fluxId).toEqual(flux.id);
        expect(binding.webhookId).toEqual(webhook.id);
    });

    it('Get all hooked flux', async () => {
        const webhook = await prisma.webhooks.create({ data: { url: 'flux_url' }});

        const firstFlux     = await prisma.flux.create({ data: { url: 'webhook_url1' } });
        const secondFlux    = await prisma.flux.create({ data: { url: 'webhook_url2' } });
        const thirdFlux     = await prisma.flux.create({ data: { url: 'webhook_url3' } });

        expect((await bindingService.getAssociatedFlux(webhook.id)).length).toEqual(0);

        for (const flux of [firstFlux, secondFlux, thirdFlux]) {
            await prisma.bindings.create({
                data: {
                    webhookId: webhook.id,
                    fluxId: flux.id
                }
            });
        }
        expect((await bindingService.getAssociatedFlux(webhook.id)).length).toEqual(3);

        const associatedFlux = await bindingService.getAssociatedFlux(webhook.id);
        expect(associatedFlux.every((flux) => {
            return [firstFlux.id, secondFlux.id, thirdFlux.id].includes(flux.id);
        })).toBeTruthy();
    });

    it('Get all flux bindings', async () => {
        const flux = await prisma.flux.create({ data: { url: 'flux_url' }});

        const firstWebHook = await prisma.webhooks.create({ data: { url: 'webhook_url1' } });
        const secondWebHook = await prisma.webhooks.create({ data: { url: 'webhook_url2' } });
        const thirdWebhook = await prisma.webhooks.create({ data: { url: 'webhook_url3' } });

        expect((await bindingService.getAssociatedWebhooks(flux.id)).length).toEqual(0);

        for (const webhook of [firstWebHook, secondWebHook, thirdWebhook]) {
            await prisma.bindings.create({
                data: {
                    webhookId: webhook.id,
                    fluxId: flux.id
                }
            });
        }
        expect((await bindingService.getAssociatedWebhooks(flux.id)).length).toEqual(3);

        const associatedWebhooks = await bindingService.getAssociatedWebhooks(flux.id);
        expect(associatedWebhooks.every((webhook) => {
            return [firstWebHook.id, secondWebHook.id, thirdWebhook.id].includes(webhook.id);
        })).toBeTruthy();
    });

});