import { Test, TestingModule } from '@nestjs/testing';
import { BindingsController } from './binding.controller';
import { FluxService, WebhooksService, BindingService, PrismaService } from '../services';
import { Request } from 'express';
import { HttpException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';

describe('Binding Controller', () => {
    let bindingsController: BindingsController;

    let prismaService: PrismaService;
    let fluxService: FluxService;
    let webhookService: WebhooksService;
    let hooksService: BindingService;

    let app: TestingModule;

    beforeAll(async () => {
        app = await Test.createTestingModule({
            controllers: [BindingsController],
            providers: [BindingService, FluxService, WebhooksService, PrismaService],
        }).compile();

        prismaService = app.get<PrismaService>(PrismaService);
        fluxService = app.get<FluxService>(FluxService);
        webhookService = app.get<WebhooksService>(WebhooksService);
        hooksService = app.get<BindingService>(BindingService);

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
            const request = {
                body: {
                    fluxId: 0,
                    webhookId: 0
                }
            } as unknown as Request;

            await expect(bindingsController.createBinding(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Not existing flux', async () => {
            const webhook = await webhookService.createWebhook('url');

            const request = {
                body: {
                    fluxId: 0,
                    webhookId: webhook.id
                }
            } as unknown as Request;

            await expect(bindingsController.createBinding(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Not existing flux', async () => {
            const flux = await fluxService.createFlux('url');

            const request = {
                body: {
                    fluxId: flux.id,
                    webhookId: 0
                }
            } as unknown as Request;

            await expect(bindingsController.createBinding(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Wrong type', async () => {
            const request = {
                body: {
                    fluxId: [],
                    webhookId: []
                }
            } as unknown as Request;

            await expect(bindingsController.createBinding(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Existing flux/webhook', async () => {
            const flux = await fluxService.createFlux('url');
            const webhook = await webhookService.createWebhook('url');

            const request = {
                body: {
                    fluxId: flux.id,
                    webhookId: webhook.id
                }
            } as unknown as Request;

            expect(await bindingsController.createBinding(request))
            .toBeTruthy();
        });

        it('Creating a hook twice flux/webhook', async () => {
            const flux = await fluxService.createFlux('url');
            const webhook = await webhookService.createWebhook('url');

            const request = {
                body: {
                    fluxId: flux.id,
                    webhookId: webhook.id
                }
            } as unknown as Request;

            await bindingsController.createBinding(request);

            await expect(bindingsController.createBinding(request))
            .rejects
            .toThrow();
        });

        it('Missing fluxId', async () => {
            const request = {
                body: {
                    webhookId: 0
                }
            } as unknown as Request;

            await expect(bindingsController.createBinding(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Missing webhookId', async () => {
            const request = {
                body: {
                    fluxId: 0
                }
            } as unknown as Request;

            await expect(bindingsController.createBinding(request))
            .rejects
            .toThrow(HttpException);
        });
    });

    describe('getAllFluxAttached', () => {
        it('Not existing webhook', async () => {
            const request = {
                query: {
                    id: '-1'
                }
            } as unknown as Request;

            await expect(bindingsController.getAllFluxAttached(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Wrong type', async () => {
            const request = {
                query: {
                    id: []
                }
            } as unknown as Request;

            await expect(bindingsController.getAllFluxAttached(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Wrong id', async () => {
            const request = {
                query: {
                    id: 'abc'
                }
            } as unknown as Request;

            await expect(bindingsController.getAllFluxAttached(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Missing id', async () => {
            const request = {
                query: {}
            } as unknown as Request;

            await expect(bindingsController.getAllFluxAttached(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Webook exist', async () => {
            const webhook = await webhookService.createWebhook('url');

            const request = {
                query: {
                    id: webhook.id.toString()
                }
            } as unknown as Request;

            expect(await bindingsController.getAllFluxAttached(request))
            .toEqual(await hooksService.getAssociatedFlux(webhook.id));

            for (let i=0; i<0; i++) {
                const flux = await fluxService.createFlux(`url${i}`);
                
                await hooksService.createBinding(flux.id, webhook.id);

                expect(await bindingsController.getAllFluxAttached(request))
                .toEqual(await hooksService.getAssociatedFlux(webhook.id));
            }
        });

        it('Two webooks exist', async () => {
            const webhook1 = await webhookService.createWebhook('url1');
            const webhook2 = await webhookService.createWebhook('url2');

            const request = {
                query: {
                    id: webhook1.id.toString()
                }
            } as unknown as Request;

            expect(await bindingsController.getAllFluxAttached(request))
            .toEqual(await hooksService.getAssociatedFlux(webhook1.id));

            await hooksService.createBinding((await fluxService.createFlux('url')).id, webhook2.id);

            for (let i=0; i<0; i++) {
                const flux = await fluxService.createFlux(`url${i}`);
                
                await hooksService.createBinding(flux.id, webhook1.id);

                expect(await bindingsController.getAllFluxAttached(request))
                .toEqual(await hooksService.getAssociatedFlux(webhook1.id));
            }
        });
    });

    describe('getAssociatedWebhooks', () => {
        it('Not existing flux', async () => {
            const request = {
                query: {
                    id: '-1'
                }
            } as unknown as Request;

            await expect(bindingsController.getAssociatedWebhooks(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Wrong type', async () => {
            const request = {
                query: {
                    id: []
                }
            } as unknown as Request;

            await expect(bindingsController.getAssociatedWebhooks(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Wrong id', async () => {
            const request = {
                query: {
                    id: 'abc'
                }
            } as unknown as Request;

            await expect(bindingsController.getAssociatedWebhooks(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Missing id', async () => {
            const request = {
                query: {}
            } as unknown as Request;

            await expect(bindingsController.getAssociatedWebhooks(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Flux exist', async () => {
            const flux = await fluxService.createFlux('url');

            const request = {
                query: {
                    id: flux.id.toString()
                }
            } as unknown as Request;

            expect(await bindingsController.getAssociatedWebhooks(request))
            .toEqual(await hooksService.getAssociatedFlux(flux.id));

            for (let i=0; i<0; i++) {
                const webhook = await webhookService.createWebhook(`url${i}`);
                
                await hooksService.createBinding(flux.id, webhook.id);

                expect(await bindingsController.getAssociatedWebhooks(request))
                .toEqual(await hooksService.getAssociatedFlux(flux.id));
            }
        });

        it('Two flux exist', async () => {
            const flux1 = await fluxService.createFlux('url1');

            const request = {
                query: {
                    id: flux1.id.toString()
                }
            } as unknown as Request;

            expect(await bindingsController.getAssociatedWebhooks(request))
            .toEqual(await hooksService.getAssociatedFlux(flux1.id));

            for (let i=0; i<0; i++) {
                const flux = await fluxService.createFlux(`url${i+3}`);
                
                await hooksService.createBinding(flux.id, flux1.id);

                expect(await bindingsController.getAssociatedWebhooks(request))
                .toEqual(await hooksService.getAssociatedFlux(flux1.id));
            }
        });
    });

    describe('deletete', () => {
        it('Not existing flux/webhook', async () => {
            const request = {
                body: {
                    fluxId: 0,
                    webhookId: 0
                }
            } as unknown as Request;

            await expect(bindingsController.delete(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Not existing webhook', async () => {
            const webhook = await webhookService.createWebhook('url');

            const request = {
                body: {
                    fluxId: 0,
                    webhookId: webhook.id
                }
            } as unknown as Request;

            await expect(bindingsController.delete(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Not existing flux', async () => {
            const flux = await fluxService.createFlux('url');

            const request = {
                body: {
                    fluxId: flux.id,
                    webhookId: 0
                }
            } as unknown as Request;

            await expect(bindingsController.delete(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Wrong type', async () => {
            const request = {
                body: {
                    fluxId: [],
                    webhookId: []
                }
            } as unknown as Request;

            await expect(bindingsController.delete(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Existing flux/webhook', async () => {
            const flux = await fluxService.createFlux('url');
            const webhook = await webhookService.createWebhook('url');

            const request = {
                body: {
                    fluxId: flux.id,
                    webhookId: webhook.id
                }
            } as unknown as Request;

            await expect(bindingsController.delete(request))
            .rejects
            .toThrow(PrismaClientKnownRequestError);

            await bindingsController.createBinding(request);

            const deletedBinding = await bindingsController.delete(request);
            expect(deletedBinding.fluxId).toEqual(flux.id);
            expect(deletedBinding.webhookId).toEqual(webhook.id);
        });

        it('Creating a hook twice flux/webhook', async () => {
            const flux = await fluxService.createFlux('url');
            const webhook = await webhookService.createWebhook('url');

            const request = {
                body: {
                    fluxId: flux.id,
                    webhookId: webhook.id
                }
            } as unknown as Request;

            await bindingsController.createBinding(request);

            const deletedBinding = await bindingsController.delete(request);
            expect(deletedBinding.fluxId).toEqual(flux.id);
            expect(deletedBinding.webhookId).toEqual(webhook.id);

            await expect(bindingsController.delete(request))
            .rejects
            .toThrow(PrismaClientKnownRequestError);
        });

        it('Missing fluxId', async () => {
            const request = {
                body: {
                    webhookId: 0
                }
            } as unknown as Request;

            await expect(bindingsController.delete(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Missing webhookId', async () => {
            const request = {
                body: {
                    fluxId: 0
                }
            } as unknown as Request;

            await expect(bindingsController.delete(request))
            .rejects
            .toThrow(HttpException);
        });
    });
});