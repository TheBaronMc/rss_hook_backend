import { PrismaService } from './prisma.service';
import { FluxService } from './flux.service'

describe('Flux service test', () => {
    let prisma = new PrismaService();
    let fluxService = new FluxService(prisma);

    beforeEach(async () => {
        await prisma.flux.deleteMany();
    });

    afterAll(async () => {
        await prisma.flux.deleteMany();
    });

    it('Create a flux', async () => {
        for (let i=1; i<=10; i++) {
            let url = `url${i}`
            let created_flux = await fluxService.createFlux(url);

            // Returns the created object in the database
            expect(created_flux.url).toEqual(url);
            expect((await prisma.flux.findFirst({
                where: { id: created_flux.id }
             })).url).toEqual(url);
            
            let flux = await prisma.flux.findMany();

            expect(flux.length).toEqual(i);
            expect(flux.filter(wh => wh.url == url).length).toEqual(1);
        }
    });

    it('Get all flux', async () => {
        let urls: Array<string> = [];

        // Add flux to the db
        for (let i=1; i<=10; i++) {
            let url = `url${i}`
            urls.push(url);
            await prisma.flux.create({
                data: { url }
            });
        }

        // Retrieve all the flux from the db
        let all_flux = await fluxService.getAllFlux();

        // Check the number of flux
        expect(all_flux.length).toEqual(10);

        // Check if a flux haven't been added twice
        expect(all_flux.every((flux) => {
            return urls.includes(flux.url) && all_flux.reduce((accum, fl) => {
                return fl.url == flux.url ? accum + 1 : accum
            }, 0) == 1
        })).toBeTruthy();
    });

    it('Delete flux', async () => {
        await prisma.flux.create({
            data: { url: 'url' }
        });

        let flux = await prisma.flux.findMany();
        expect(flux.length).toEqual(1);

        await fluxService.deleteFlux(flux[0].id);
        expect((await prisma.flux.findMany()).length).toEqual(0);
    });

    it('Update flux', async () => {
        const FIRST_URL = 'url1';
        const SECOND_URL = 'url2';

        // Create the flux
        await prisma.flux.create({
            data: { url: FIRST_URL }
        });

        let flux = await prisma.flux.findMany();
        expect(flux[0].url).toEqual(FIRST_URL);

        // Update the flux url value
        await fluxService.updateFlux(flux[0].id, SECOND_URL);
        expect((await prisma.flux.findMany())[0].url).toEqual(SECOND_URL);
    });

});