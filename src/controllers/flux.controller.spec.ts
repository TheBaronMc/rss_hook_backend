import { Test, TestingModule } from '@nestjs/testing';
import { FluxController } from './flux.controller';
import { ArticleService, DeliveryService, WebhooksService, BindingService, FluxService, PrismaService } from '../services';
import { CreateFluxDto, DeleteFluxDto, UpdateFluxDto } from '../dataTranferObjects/flux.dto';
import { NotFoundError, PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { FeedParseError } from '../rssFeed/manager/feedManager';
import { JwtService } from '@nestjs/jwt';

describe('Flux controller tests', () => {
    let fluxController: FluxController;

    let prismaService: PrismaService;
    let articleService: ArticleService;
    let fluxService: FluxService;
    let webhookService: WebhooksService;
    let deliveryService: DeliveryService;
    let bindingService: BindingService;

    let app: TestingModule;

    beforeAll(async () => {
        app = await Test.createTestingModule({
            controllers: [FluxController],
            providers: [FluxService, ArticleService, BindingService, DeliveryService, PrismaService, JwtService],
        }).compile();

        prismaService   = app.get<PrismaService>(PrismaService);
        fluxService     = app.get<FluxService>(FluxService);
        articleService  = app.get<ArticleService>(ArticleService);
        bindingService     = app.get<BindingService>(BindingService);
        deliveryService = app.get<DeliveryService>(DeliveryService);

        fluxController  = app.get<FluxController>(FluxController);

        webhookService  = new WebhooksService(prismaService);

        await app.init();
    });

    beforeEach(async () => {
        await prismaService.deliveries.deleteMany();
        await prismaService.articles.deleteMany();
        await prismaService.bindings.deleteMany();
        await prismaService.webhooks.deleteMany();
        await prismaService.flux.deleteMany();
    });

    afterAll(async () => {
        await prismaService.deliveries.deleteMany();
        await prismaService.articles.deleteMany();
        await prismaService.bindings.deleteMany();
        await prismaService.webhooks.deleteMany();
        await prismaService.flux.deleteMany();

        await app.close();
    });
    
    describe('create', () => {
        it('Good url but not a feed', async () => {
            const aCreateFluxDto = new CreateFluxDto();
            aCreateFluxDto.url = 'http://toto.org';

            await expect(fluxController.create(aCreateFluxDto))
            .rejects
            .toThrow(FeedParseError);
        });

        it('Good url and good feed', async () => {
            const aUrl = 'https://www.lemonde.fr/sport/rss_full.xml';
            const aCreateFluxDto = new CreateFluxDto();
            aCreateFluxDto.url = aUrl;

            const createdFlux = await fluxController.create(aCreateFluxDto);

            expect(createdFlux.url)
            .toEqual(aUrl);
        });
    });

    describe('getAll', () => {
        it('Get all flux', async () => {
            expect(await fluxController.getAll())
            .toEqual(await fluxService.getAllFlux());

            for (let i=0; i<2; i++)
                expect(await fluxController.getAll())
                .toEqual(await fluxService.getAllFlux());
        });
    });

    describe('delete', () => {
        it('Unknow id', async () => {
            const aDeleteFluxDto = new DeleteFluxDto();
            aDeleteFluxDto.id = 1;

            await expect(fluxController.delete(aDeleteFluxDto))
            .rejects
            .toThrow(PrismaClientKnownRequestError);
        });

        it('Remove flux and everything related to it', async () => {
            const flux = await fluxService.createFlux('url');
            const webhook = await webhookService.createWebhook('url');
            const article = await articleService.createArticle('toto', flux.id);

            await bindingService.createBinding(flux.id, webhook.id);
            await deliveryService.createDelevery(webhook.id, article.id);

            const aDeleteFluxDto = new DeleteFluxDto();
            aDeleteFluxDto.id = flux.id;

            await fluxController.delete(aDeleteFluxDto);

            expect((await fluxService.getAllFlux()).length)
            .toEqual(0);

            expect((await articleService.getArticlesSendedBy(flux.id)).length)
            .toEqual(0);

            expect((await deliveryService.getDelevriesTo(webhook.id)).length)
            .toEqual(0);

            expect((await bindingService.getAssociatedFlux(webhook.id)).length)
            .toEqual(0);
        });
    });

    describe('update', () => {
        it('Unknow id', async () => {
            const updateFluxDto = new UpdateFluxDto();
            updateFluxDto.id = 1;
            updateFluxDto.url = 'https://www.lemonde.fr/sport/rss_full.xml';

            await expect(fluxController.update(updateFluxDto))
            .rejects
            .toThrow(NotFoundError);
        });

        it('Good id and good url', async () => {
            const newUrl = 'https://www.lemonde.fr/sport/rss_full.xml';

            const flux = await fluxService.createFlux('url');

            const updateFluxDto = new UpdateFluxDto();
            updateFluxDto.id = flux.id;
            updateFluxDto.url = newUrl;

            await fluxController.update(updateFluxDto);

            expect((await fluxService.getFlux(flux.id)).url)
            .toEqual(newUrl);
        });
    });
});