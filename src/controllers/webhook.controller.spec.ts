import { Test, TestingModule } from '@nestjs/testing';
import { WebhookController } from './webhook.controller';
import { FluxService, WebhooksService, BindingService, ArticleService, DeliveryService, PrismaService } from '../services';
import { HttpException } from '@nestjs/common';
import { CreateWebhookDto, DeleteWebhookDto, GetWebhookDto, UpdateWebhookDto } from '../dataTranferObjects/webhook.dto';
import { NotFoundError, PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { JwtService } from '@nestjs/jwt';

describe('Webhook Controller', () => {
    let webhookController: WebhookController;

    let prismaService: PrismaService;
    let fluxService: FluxService;
    let webhookService: WebhooksService;
    let bindingService: BindingService;
    let deliveryService: DeliveryService;
    let articleService: ArticleService;

    let app: TestingModule;

    beforeAll(async () => {
        app = await Test.createTestingModule({
            controllers: [WebhookController],
            providers: [WebhooksService, BindingService, DeliveryService, PrismaService, JwtService],
        }).compile();

        prismaService = app.get<PrismaService>(PrismaService);
        webhookService = app.get<WebhooksService>(WebhooksService);
        deliveryService = app.get<DeliveryService>(DeliveryService);
        bindingService = app.get<BindingService>(BindingService);

        webhookController = app.get<WebhookController>(WebhookController);

        fluxService = new FluxService(prismaService);
        articleService = new ArticleService(prismaService);
    });

    beforeEach(async () => {
        await prismaService.deliveries.deleteMany();
        await prismaService.articles.deleteMany();
        await prismaService.bindings.deleteMany();
        await prismaService.flux.deleteMany();
        await prismaService.webhooks.deleteMany();
    });

    afterAll(async () => {
        await prismaService.deliveries.deleteMany();
        await prismaService.articles.deleteMany();
        await prismaService.bindings.deleteMany();
        await prismaService.flux.deleteMany();
        await prismaService.webhooks.deleteMany();

        await app.close();
    });


    describe('create', () => {
        it('Wrong url format', async () => {
            const createWebhookDto = new CreateWebhookDto();
            createWebhookDto.url = 'NotAUrl';

            await expect(webhookController.create(createWebhookDto))
            .rejects
            .toThrow(HttpException);
        });

        it('Good url format', async () => {
            const url = 'http://toto.org';

            const createWebhookDto = new CreateWebhookDto();
            createWebhookDto.url = url;

            const createdWebhook = await webhookController.create(createWebhookDto);
            expect(createdWebhook.url).toEqual(url);          
        });

        it('Register the same url', async () => {
            const url = 'http://toto.org';

            const createWebhookDto = new CreateWebhookDto();
            createWebhookDto.url = url;

            await webhookController.create(createWebhookDto);
            
            await expect(webhookController.create(createWebhookDto))
            .rejects
            .toThrow(PrismaClientKnownRequestError);
        });
    });

    describe('getAll', () => {
        it('Get all webhooks', async () => {
            expect(await webhookController.getAll())
            .toEqual(await webhookService.getAllWebhooks());

            for (let i=0; i<2; i++) {
                await webhookService.createWebhook(`url${i}`);

                expect(await webhookController.getAll())
                .toEqual(await webhookService.getAllWebhooks());
            }
        });
    });

    describe('get', () => {
        it('Unknow id', async () => {
            const getWebhookDto = new GetWebhookDto();
            getWebhookDto.id = 1;

            await expect(webhookController.getWebhook(getWebhookDto))
            .rejects
            .toThrow(NotFoundError);
        });

        it('Good id', async () => {
            const aUrl = 'url';
            const aCreatedWebhook = await webhookService.createWebhook(aUrl);

            const getWebhookDto = new GetWebhookDto();
            getWebhookDto.id = aCreatedWebhook.id;

            const aWebhook = await webhookController.getWebhook(getWebhookDto);
            expect(aWebhook.id)
            .toEqual(aCreatedWebhook.id);
        });
    });

    describe('delete', () => {
        it('Delete webhook and everything about it', async () => {
            const webhook = await webhookService.createWebhook('url');
            const flux = await fluxService.createFlux('url');
            const article = await articleService.createArticle('toto', flux.id);

            await bindingService.createBinding(flux.id, webhook.id);

            await deliveryService.createDelevery(webhook.id, article.id);

            const deleteWebhookDto = new DeleteWebhookDto();
            deleteWebhookDto.id = webhook.id;
            await webhookController.delete(deleteWebhookDto);

            expect((await webhookService.getAllWebhooks()).length)
            .toEqual(0);

            expect((await deliveryService.getDelevriesTo(webhook.id)).length)
            .toEqual(0);

            expect((await bindingService.getAssociatedFlux(webhook.id)).length)
            .toEqual(0);
        });
    });

    describe('update', () => {
        it('Unknow id', async () => {
            const updateWebhookDto = new UpdateWebhookDto();
            updateWebhookDto.id = 9999;
            updateWebhookDto.url = 'http://toto.org';

            await expect(webhookController.update(updateWebhookDto))
            .rejects
            .toThrow(PrismaClientKnownRequestError);
        });

        it('Good id & good url', async () => {
            const webhook = await webhookService.createWebhook('url');

            const updateWebhookDto = new UpdateWebhookDto();
            updateWebhookDto.id = webhook.id;
            updateWebhookDto.url = 'http://toto.org';

            await webhookController.update(updateWebhookDto);
        });
    });


});