import { Test, TestingModule } from '@nestjs/testing';
import { DeliveriesController } from './deliveries.controller';
import { ArticleService, FluxService, WebhooksService, DeliveryService, PrismaService } from '../services';

import { GetDeliverySrcDto, GetDeliveryDstDto } from '../dataTranferObjects/delivery.dto';

describe('Delivery Controller', () => {
    let deliveryController: DeliveriesController;

    let prismaService: PrismaService;
    let articleService: ArticleService;
    let fluxService: FluxService;
    let webhookService: WebhooksService;
    let deliveryService: DeliveryService;

    let app: TestingModule;

    beforeAll(async () => {
        app = await Test.createTestingModule({
            controllers: [DeliveriesController],
            providers: [DeliveryService, PrismaService],
        }).compile();

        
        prismaService = app.get<PrismaService>(PrismaService);
        deliveryService = app.get<DeliveryService>(DeliveryService);

        deliveryController = app.get<DeliveriesController>(DeliveriesController);

        articleService = new ArticleService(prismaService);
        fluxService = new FluxService(prismaService);
        webhookService = new WebhooksService(prismaService);
    });

    beforeEach(async () => {
        await prismaService.deliveries.deleteMany();
        await prismaService.articles.deleteMany();
        await prismaService.flux.deleteMany();
        await prismaService.webhooks.deleteMany();
    });

    afterAll(async () => {
        await prismaService.deliveries.deleteMany();
        await prismaService.articles.deleteMany();
        await prismaService.flux.deleteMany();
        await prismaService.webhooks.deleteMany();

        await app.close();
    });

    describe('getAllDeliveriesTo', () => {
        it('Unknow id', async () => {
            const getDeliverySrcDto = new GetDeliverySrcDto();
            getDeliverySrcDto.id = 1;

            expect(await deliveryController.getAllDeliveriesTo(getDeliverySrcDto))
            .toEqual([]);
        });

        it('Webhook with no deliveries', async () => {
            const aWebhook = await webhookService.createWebhook('url');
            
            const getDeliverySrcDto = new GetDeliverySrcDto();
            getDeliverySrcDto.id = aWebhook.id;

            expect(await deliveryController.getAllDeliveriesTo(getDeliverySrcDto))
            .toEqual([]);
        });

        it('Webhook with deliveries', async () => {
            const aWebhook = await webhookService.createWebhook('url');
            const aFlux = await fluxService.createFlux('url');
            for (let i=0; i<2; i++) {
                const article = await articleService.createArticle('title', aFlux.id);
                await deliveryService.createDelevery(aWebhook.id, article.id);
            }
            
            const getDeliverySrcDto = new GetDeliverySrcDto();
            getDeliverySrcDto.id = aWebhook.id;

            expect(await deliveryController.getAllDeliveriesTo(getDeliverySrcDto))
            .toEqual(await deliveryService.getDelevriesTo(aWebhook.id));
        });
    });
    
    describe('getAllDeliveryDestination', () => {
        it('Unknow id', async () => {
            const aDelevieryDstDto = new GetDeliveryDstDto();
            aDelevieryDstDto.id = 1;

            expect(await deliveryController.getAllDeliveryDestination(aDelevieryDstDto))
            .toEqual([]);
        });

        it('Webhook with no deliveries', async () => {
            const flux = await fluxService.createFlux('url');
            const article = await articleService.createArticle('title', flux.id);
            
            const aDelevieryDstDto = new GetDeliveryDstDto();
            aDelevieryDstDto.id = article.id;

            expect(await deliveryController.getAllDeliveryDestination(aDelevieryDstDto))
            .toEqual([]);
        });

        it('Webhook with no deliveries', async () => {
            const flux = await fluxService.createFlux('url');
            const article = await articleService.createArticle('title', flux.id);
            for (let i=0; i<2; i++) {
                const webhook = await webhookService.createWebhook(`url${i}`);
                await deliveryService.createDelevery(webhook.id, article.id);
            }
            
            const aDelevieryDstDto = new GetDeliveryDstDto();
            aDelevieryDstDto.id = article.id;

            expect(await deliveryController.getAllDeliveryDestination(aDelevieryDstDto))
            .toEqual(await deliveryService.getDelevriesOf(article.id));
        });
    });
});