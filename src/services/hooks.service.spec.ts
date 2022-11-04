import { PrismaService } from './prisma.service';
import { HooksService } from './hooks.service'

describe('Webhooks service test', () => {
    let prisma = new PrismaService();
    let hooksService = new HooksService(prisma);

    beforeEach(async () => {
        await prisma.hooks.deleteMany();
        await prisma.webhooks.deleteMany();
        await prisma.flux.deleteMany();
    });

    afterAll(async () => {
        await prisma.hooks.deleteMany();
        await prisma.webhooks.deleteMany();
        await prisma.flux.deleteMany();
    });

    it('Create a hook', async () => {
        let isHooked = await hooksService.create_hook(-9999,-9999);
        expect(isHooked).toBeFalsy();

        let flux = await prisma.flux.create({ data: { url: 'url' } });

        isHooked = await hooksService.create_hook(flux.id,-9999);
        expect(isHooked).toBeFalsy();

        let wh = await prisma.webhooks.create({ data: { url: 'url' } });

        isHooked = await hooksService.create_hook(-9999,wh.id);
        expect(isHooked).toBeFalsy();

        isHooked = await hooksService.create_hook(flux.id, wh.id);
        expect(isHooked).toBeTruthy();
    });

    it('Delete a hook', async () => {
        let isHooked = await hooksService.delete_hook(-9999,-9999);
        expect(isHooked).toBeFalsy();

        let flux = await prisma.flux.create({ data: { url: 'url' } });

        isHooked = await hooksService.delete_hook(flux.id,-9999);
        expect(isHooked).toBeFalsy();

        let wh = await prisma.webhooks.create({ data: { url: 'url' } });

        isHooked = await hooksService.delete_hook(-9999,wh.id);
        expect(isHooked).toBeFalsy();

        await prisma.hooks.create({
            data: {
                destinationId: flux.id,
                sourceId: wh.id
            }
        });

        isHooked = await hooksService.delete_hook(flux.id, wh.id);
        expect(isHooked).toBeTruthy();
    });

    it('Get all hooked flux', async () => {
        let wh = await prisma.webhooks.create({ data: { url: 'flux_url' }});

        let f1 = await prisma.flux.create({ data: { url: 'webhook_url1' } });
        let f2 = await prisma.flux.create({ data: { url: 'webhook_url2' } });
        let f3 = await prisma.flux.create({ data: { url: 'webhook_url3' } });

        expect((await hooksService.get_hooked(wh.id)).length).toEqual(0);

        let nb_hook = 0;
        for (let f of [f1, f2, f3]) {
            await prisma.hooks.create({
                data: {
                    sourceId: wh.id,
                    destinationId: f.id
                }
            });
            nb_hook++;
            expect((await hooksService.get_hooked(wh.id)).length).toEqual(nb_hook);
        }

        let hookeds = await hooksService.get_hooked(wh.id);

        expect(hookeds.every((hooked) => [f1.id, f2.id, f3.id].includes(hooked.id))).toBeTruthy()
    });

    it('Get all flux hooks', async () => {
        let flux = await prisma.flux.create({ data: { url: 'flux_url' }});

        let wh1 = await prisma.webhooks.create({ data: { url: 'webhook_url1' } });
        let wh2 = await prisma.webhooks.create({ data: { url: 'webhook_url2' } });
        let wh3 = await prisma.webhooks.create({ data: { url: 'webhook_url3' } });

        expect((await hooksService.get_hooks(flux.id)).length).toEqual(0);

        let nb_hook = 0;
        for (let wh of [wh1, wh2, wh3]) {
            await prisma.hooks.create({
                data: {
                    sourceId: wh.id,
                    destinationId: flux.id
                }
            });
            nb_hook++;
            expect((await hooksService.get_hooks(flux.id)).length).toEqual(nb_hook);
        }

        let hooks = await hooksService.get_hooks(flux.id);

        expect(hooks.every((hook) => [wh1.id, wh2.id, wh3.id].includes(hook.id))).toBeTruthy()
    });

});