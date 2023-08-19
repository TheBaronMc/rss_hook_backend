import { PrismaService } from './prisma.service';
import { FluxService } from './flux.service';
import { NotFoundError } from '@prisma/client/runtime';

describe('Flux service test', () => {
    const prisma = new PrismaService();
    const fluxService = new FluxService(prisma);

    beforeEach(async () => {
        await prisma.flux.deleteMany();
    });

    afterAll(async () => {
        await prisma.flux.deleteMany();
    });

    it('Create a flux', async () => {
        expect((await prisma.flux.findMany()).length).toEqual(0);

        const url = 'url';
        const createdFlux = await fluxService.createFlux(url);
        expect(createdFlux.url).toEqual(url);

        expect((await prisma.flux.findMany()).length).toEqual(1);
    });

    it('Create multiple flux', async () => {
        expect((await prisma.flux.findMany()).length).toEqual(0);

        for (let i=1; i<=10; i++) {
            const url = `url${i}`;
            const createdFlux = await fluxService.createFlux(url);

            // Returns the created object in the database
            expect(createdFlux.url).toEqual(url);
            expect((await prisma.flux.findFirst({
                where: { id: createdFlux.id }
            })).url).toEqual(url);
            
            const allflux = await prisma.flux.findMany();

            expect(allflux.length).toEqual(i);
            expect(allflux.filter(wh => wh.url == url).length).toEqual(1);
        }
    });

    describe('Get', () => {
        it('Unkown id', async () => {
            await expect(fluxService.getFlux(1))
            .rejects
            .toThrow(NotFoundError);
        });

        it('Kown id', async () => {
            const aUrl = 'url';

            const createdFlux = await prisma.flux.create({
                data: { url: aUrl }
            });

            const aFlux = await fluxService.getFlux(createdFlux.id);
            expect(aFlux).toEqual(createdFlux);
        });
    });

    it('Get all flux', async () => {
        const urls: Array<string> = [];

        // Add flux to the db
        for (let i=1; i<=10; i++) {
            const url = `url${i}`;
            urls.push(url);
            await prisma.flux.create({
                data: { url }
            });
        }

        // Retrieve all the flux from the db
        const allFlux = await fluxService.getAllFlux();

        // Check the number of flux
        expect(allFlux.length).toEqual(10);

        // Check if a flux haven't been added twice
        expect(allFlux.every((flux) => {
            return urls.includes(flux.url) && allFlux.reduce((accum, fl) => {
                return fl.url == flux.url ? accum + 1 : accum;
            }, 0) == 1;
        })).toBeTruthy();
    });

    it('Delete flux', async () => {
        await prisma.flux.create({
            data: { url: 'url' }
        });

        const flux = await prisma.flux.findMany();
        expect(flux.length).toEqual(1);

        await fluxService.deleteFlux(flux[0].id);
        expect((await prisma.flux.findMany()).length).toEqual(0);
    });

    it('Update flux', async () => {
        const firstUrl = 'url1';
        const secondUrl = 'url2';

        // Create the flux
        await prisma.flux.create({
            data: { url: firstUrl }
        });

        const flux = await prisma.flux.findMany();
        expect(flux[0].url).toEqual(firstUrl);

        // Update the flux url value
        await fluxService.updateFlux(flux[0].id, secondUrl);
        expect((await prisma.flux.findMany())[0].url).toEqual(secondUrl);
    });

});