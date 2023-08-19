import { Test, TestingModule } from '@nestjs/testing';
import { BindingsController } from './binding.controller';
import { FluxService, WebhooksService, BindingService, PrismaService } from '../services';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { CreateBindingDto, DeleteBindingDto, GetFluxBindingsDto, GetWebhookBindingsDto } from '../dataTranferObjects/binding.dto';

describe('Binding Controller', () => {
    let bindingsController: BindingsController;

    let prismaService: PrismaService;
    let fluxService: FluxService;
    let webhookService: WebhooksService;
    let bindingService: BindingService;

    let app: TestingModule;

    beforeAll(async () => {
        app = await Test.createTestingModule({
            controllers: [BindingsController],
            providers: [BindingService, PrismaService],
        }).compile();

        prismaService = app.get<PrismaService>(PrismaService);
        fluxService = new FluxService(prismaService);
        webhookService = new WebhooksService(prismaService);
        bindingService = app.get<BindingService>(BindingService);

        bindingsController = app.get<BindingsController>(BindingsController);
    });

    beforeEach(async () => {
        await prismaService.bindings.deleteMany();
        await prismaService.flux.deleteMany();
        await prismaService.webhooks.deleteMany();
    });

    afterAll(async () => {
        await prismaService.bindings.deleteMany();
        await prismaService.flux.deleteMany();
        await prismaService.webhooks.deleteMany();

        await app.close();
    });


    describe('create', () => {
        it('Not existing flux/webhook', async () => {
            const createBindingDto = new CreateBindingDto();
            createBindingDto.fluxId = 0;
            createBindingDto.webhookId = 0;

            await expect(bindingsController.createBinding(createBindingDto))
            .rejects
            .toThrow(PrismaClientKnownRequestError);
        });

        it('Not existing flux', async () => {
            const webhook = await webhookService.createWebhook('url');

            const createBindingDto = new CreateBindingDto();
            createBindingDto.fluxId = 0;
            createBindingDto.webhookId = webhook.id;

            await expect(bindingsController.createBinding(createBindingDto))
            .rejects
            .toThrow(PrismaClientKnownRequestError);
        });

        it('Not existing flux', async () => {
            const flux = await fluxService.createFlux('url');

            const createBindingDto = new CreateBindingDto();
            createBindingDto.fluxId = flux.id;
            createBindingDto.webhookId = 0;

            await expect(bindingsController.createBinding(createBindingDto))
            .rejects
            .toThrow(PrismaClientKnownRequestError);
        });


        it('Existing flux/webhook', async () => {
            const flux = await fluxService.createFlux('url');
            const webhook = await webhookService.createWebhook('url');

            const createBindingDto = new CreateBindingDto();
            createBindingDto.fluxId = flux.id;
            createBindingDto.webhookId = webhook.id;

            const createdBinding = await bindingsController.createBinding(createBindingDto);
            expect(createdBinding.fluxId).toEqual(flux.id);
            expect(createdBinding.webhookId).toEqual(webhook.id);
        });

        it('Creating a hook twice flux/webhook', async () => {
            const flux = await fluxService.createFlux('url');
            const webhook = await webhookService.createWebhook('url');

            const createBindingDto = new CreateBindingDto();
            createBindingDto.fluxId = flux.id;
            createBindingDto.webhookId = webhook.id;

            await bindingsController.createBinding(createBindingDto);

            await expect(bindingsController.createBinding(createBindingDto))
            .rejects
            .toThrow(PrismaClientKnownRequestError);
        });

    });

    describe('getAllFluxAttached', () => {
        it('Not existing webhook', async () => {
            const getFluxBindingsDto = new GetFluxBindingsDto();
            getFluxBindingsDto.id = 1;

            expect(await bindingsController.getAllFluxAttached(getFluxBindingsDto))
            .toEqual([]);
        });


        it('Webook exist', async () => {
            const webhook = await webhookService.createWebhook('url');

            const getFluxBindingsDto = new GetFluxBindingsDto();
            getFluxBindingsDto.id = webhook.id;

            expect(await bindingsController.getAllFluxAttached(getFluxBindingsDto))
            .toEqual(await bindingService.getAssociatedFlux(webhook.id));

            for (let i=0; i<0; i++) {
                const flux = await fluxService.createFlux(`url${i}`);
                
                await bindingService.createBinding(flux.id, webhook.id);

                expect(await bindingsController.getAllFluxAttached(getFluxBindingsDto))
                .toEqual(await bindingService.getAssociatedFlux(webhook.id));
            }
        });
    });

    describe('getAssociatedWebhooks', () => {
        it('Not existing flux', async () => {
            const getWebhookBindingsDto = new GetWebhookBindingsDto();
            getWebhookBindingsDto.id = 1;

            expect(await bindingsController.getAssociatedWebhooks(getWebhookBindingsDto))
            .toEqual([]);
        });

        it('Flux exist', async () => {
            const flux = await fluxService.createFlux('url');

            const getWebhookBindingsDto = new GetWebhookBindingsDto();
            getWebhookBindingsDto.id = flux.id;

            expect(await bindingsController.getAssociatedWebhooks(getWebhookBindingsDto))
            .toEqual(await bindingService.getAssociatedFlux(flux.id));

            for (let i=0; i<0; i++) {
                const webhook = await webhookService.createWebhook(`url${i}`);
                
                await bindingService.createBinding(flux.id, webhook.id);

                expect(await bindingsController.getAssociatedWebhooks(getWebhookBindingsDto))
                .toEqual(await bindingService.getAssociatedFlux(flux.id));
            }
        });
    });

    describe('deletete', () => {
        it('Not existing flux/webhook', async () => {
            const deleteService = new DeleteBindingDto();
            deleteService.fluxId = 1;
            deleteService.webhookId = 1;

            await expect(bindingsController.delete(deleteService))
            .rejects
            .toThrow(PrismaClientKnownRequestError);
        });

        it('Not existing webhook', async () => {
            const webhook = await webhookService.createWebhook('url');

            const deleteService = new CreateBindingDto();
            deleteService.fluxId = 1;
            deleteService.webhookId = webhook.id;

            await expect(bindingsController.delete(deleteService))
            .rejects
            .toThrow(PrismaClientKnownRequestError);
        });

        it('Not existing flux', async () => {
            const flux = await fluxService.createFlux('url');

            const deleteService = new CreateBindingDto();
            deleteService.fluxId = flux.id;
            deleteService.webhookId = 1;

            await expect(bindingsController.delete(deleteService))
            .rejects
            .toThrow(PrismaClientKnownRequestError);
        });

        it('Existing flux/webhook', async () => {
            const flux = await fluxService.createFlux('url');
            const webhook = await webhookService.createWebhook('url');

            await bindingService.createBinding(flux.id, webhook.id);

            const deleteService = new CreateBindingDto();
            deleteService.fluxId = flux.id;
            deleteService.webhookId = webhook.id;

            const deletedBinding = await bindingsController.delete(deleteService);
            expect(deletedBinding.fluxId).toEqual(flux.id);
            expect(deletedBinding.webhookId).toEqual(webhook.id);
        });

        it('Creating a hook twice flux/webhook', async () => {
            const flux = await fluxService.createFlux('url');
            const webhook = await webhookService.createWebhook('url');

            await bindingService.createBinding(flux.id, webhook.id);

            const deleteService = new CreateBindingDto();
            deleteService.fluxId = flux.id;
            deleteService.webhookId = webhook.id;

           await bindingsController.delete(deleteService);

            await expect(bindingsController.delete(deleteService))
            .rejects
            .toThrow(PrismaClientKnownRequestError);
        });
    });
});