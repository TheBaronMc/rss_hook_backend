import { Test, TestingModule } from '@nestjs/testing';
import { HooksController } from './hook.controller'
import { FluxService, WebhooksService, HooksService, PrismaService } from '../services'
import { Request } from 'express';
import { HttpException } from '@nestjs/common';

describe('Hook Controller', () => {
    let hooksController: HooksController;

    let prismaService = new PrismaService();
    let fluxService = new FluxService(prismaService);
    let webhookService = new WebhooksService(prismaService);
    let hooksService = new HooksService(prismaService);

    beforeEach(async () => {
        const app: TestingModule = await Test.createTestingModule({
            controllers: [HooksController],
            providers: [HooksService, FluxService, WebhooksService, PrismaService],
        }).compile();

        hooksController = app.get<HooksController>(HooksController);

        await prismaService.hooks.deleteMany();
        await prismaService.flux.deleteMany();
        await prismaService.webhooks.deleteMany();
    });

    afterAll(async () => {
        await prismaService.hooks.deleteMany();
        await prismaService.flux.deleteMany();
        await prismaService.webhooks.deleteMany();
    });


    describe('create', () => {
        it('Not existing flux/webhook', async () => {
            let request = {
                body: {
                    flux_id: 0,
                    webhook_id: 0
                }
            } as unknown as Request;

            await expect(hooksController.create(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Not existing flux', async () => {
            let webhook = await webhookService.createWebhook('url');

            let request = {
                body: {
                    flux_id: 0,
                    webhook_id: webhook.id
                }
            } as unknown as Request;

            await expect(hooksController.create(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Not existing flux', async () => {
            let flux = await fluxService.createFlux('url');

            let request = {
                body: {
                    flux_id: flux.id,
                    webhook_id: 0
                }
            } as unknown as Request;

            await expect(hooksController.create(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Wrong type', async () => {
            let request = {
                body: {
                    flux_id: [],
                    webhook_id: []
                }
            } as unknown as Request;

            await expect(hooksController.create(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Existing flux/webhook', async () => {
            let flux = await fluxService.createFlux('url');
            let webhook = await webhookService.createWebhook('url');

            let request = {
                body: {
                    flux_id: flux.id,
                    webhook_id: webhook.id
                }
            } as unknown as Request;

            expect(await hooksController.create(request))
            .toBeTruthy();
        });

        it('Creating a hook twice flux/webhook', async () => {
            let flux = await fluxService.createFlux('url');
            let webhook = await webhookService.createWebhook('url');

            let request = {
                body: {
                    flux_id: flux.id,
                    webhook_id: webhook.id
                }
            } as unknown as Request;

            await hooksController.create(request);

            expect(await hooksController.create(request))
            .toBeFalsy();
        });

        it('Missing flux_id', async () => {
            let request = {
                body: {
                    webhook_id: 0
                }
            } as unknown as Request;

            await expect(hooksController.create(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Missing webhook_id', async () => {
            let request = {
                body: {
                    flux_id: 0
                }
            } as unknown as Request;

            await expect(hooksController.create(request))
            .rejects
            .toThrow(HttpException);
        });
    });

    describe('getAllFluxAttached', () => {
        it('Not existing webhook', async () => {
            let request = {
                query: {
                    id: '-1'
                }
            } as unknown as Request;

            await expect(hooksController.getAllFluxAttached(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Wrong type', async () => {
            let request = {
                query: {
                    id: []
                }
            } as unknown as Request;

            await expect(hooksController.getAllFluxAttached(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Wrong id', async () => {
            let request = {
                query: {
                    id: 'abc'
                }
            } as unknown as Request;

            await expect(hooksController.getAllFluxAttached(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Missing id', async () => {
            let request = {
                query: {}
            } as unknown as Request;

            await expect(hooksController.getAllFluxAttached(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Webook exist', async () => {
            let webhook = await webhookService.createWebhook('url');

            let request = {
                query: {
                    id: webhook.id.toString()
                }
            } as unknown as Request;

            expect(await hooksController.getAllFluxAttached(request))
            .toEqual(await hooksService.get_hooked(webhook.id));

            for (let i=0; i<0; i++) {
                let flux = await fluxService.createFlux('url');
                
                await hooksService.create_hook(flux.id, webhook.id);

                expect(await hooksController.getAllFluxAttached(request))
                .toEqual(await hooksService.get_hooked(webhook.id));
            }
        });

        it('Two webooks exist', async () => {
            let webhook1 = await webhookService.createWebhook('url');
            let webhook2 = await webhookService.createWebhook('url');

            let request = {
                query: {
                    id: webhook1.id.toString()
                }
            } as unknown as Request;

            expect(await hooksController.getAllFluxAttached(request))
            .toEqual(await hooksService.get_hooked(webhook1.id));

            await hooksService.create_hook((await fluxService.createFlux('url')).id, webhook2.id);

            for (let i=0; i<0; i++) {
                let flux = await fluxService.createFlux('url');
                
                await hooksService.create_hook(flux.id, webhook1.id);

                expect(await hooksController.getAllFluxAttached(request))
                .toEqual(await hooksService.get_hooked(webhook1.id));
            }
        });
    });

    describe('getAllWebhookAttached', () => {
        it('Not existing flux', async () => {
            let request = {
                query: {
                    id: '-1'
                }
            } as unknown as Request;

            await expect(hooksController.getAllWebhookAttached(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Wrong type', async () => {
            let request = {
                query: {
                    id: []
                }
            } as unknown as Request;

            await expect(hooksController.getAllWebhookAttached(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Wrong id', async () => {
            let request = {
                query: {
                    id: 'abc'
                }
            } as unknown as Request;

            await expect(hooksController.getAllWebhookAttached(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Missing id', async () => {
            let request = {
                query: {}
            } as unknown as Request;

            await expect(hooksController.getAllWebhookAttached(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Flux exist', async () => {
            let flux = await fluxService.createFlux('url');

            let request = {
                query: {
                    id: flux.id.toString()
                }
            } as unknown as Request;

            expect(await hooksController.getAllWebhookAttached(request))
            .toEqual(await hooksService.get_hooked(flux.id));

            for (let i=0; i<0; i++) {
                let webhook = await webhookService.createWebhook('url');
                
                await hooksService.create_hook(flux.id, webhook.id);

                expect(await hooksController.getAllWebhookAttached(request))
                .toEqual(await hooksService.get_hooked(flux.id));
            }
        });

        it('Two flux exist', async () => {
            let flux1 = await fluxService.createFlux('url');
            let flux2 = await fluxService.createFlux('url');

            let request = {
                query: {
                    id: flux1.id.toString()
                }
            } as unknown as Request;

            expect(await hooksController.getAllWebhookAttached(request))
            .toEqual(await hooksService.get_hooked(flux1.id));

            await hooksService.create_hook((await fluxService.createFlux('url')).id, flux2.id);

            for (let i=0; i<0; i++) {
                let flux = await fluxService.createFlux('url');
                
                await hooksService.create_hook(flux.id, flux1.id);

                expect(await hooksController.getAllWebhookAttached(request))
                .toEqual(await hooksService.get_hooked(flux1.id));
            }
        });
    });

    describe('deletete', () => {
        it('Not existing flux/webhook', async () => {
            let request = {
                body: {
                    flux_id: 0,
                    webhook_id: 0
                }
            } as unknown as Request;

            await expect(hooksController.delete(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Not existing webhook', async () => {
            let webhook = await webhookService.createWebhook('url');

            let request = {
                body: {
                    flux_id: 0,
                    webhook_id: webhook.id
                }
            } as unknown as Request;

            await expect(hooksController.delete(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Not existing flux', async () => {
            let flux = await fluxService.createFlux('url');

            let request = {
                body: {
                    flux_id: flux.id,
                    webhook_id: 0
                }
            } as unknown as Request;

            await expect(hooksController.delete(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Wrong type', async () => {
            let request = {
                body: {
                    flux_id: [],
                    webhook_id: []
                }
            } as unknown as Request;

            await expect(hooksController.delete(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Existing flux/webhook', async () => {
            let flux = await fluxService.createFlux('url');
            let webhook = await webhookService.createWebhook('url');

            let request = {
                body: {
                    flux_id: flux.id,
                    webhook_id: webhook.id
                }
            } as unknown as Request;

            expect(await hooksController.delete(request))
            .toBeFalsy();

            await hooksController.create(request)

            expect(await hooksController.delete(request))
            .toBeTruthy();
        });

        it('Creating a hook twice flux/webhook', async () => {
            let flux = await fluxService.createFlux('url');
            let webhook = await webhookService.createWebhook('url');

            let request = {
                body: {
                    flux_id: flux.id,
                    webhook_id: webhook.id
                }
            } as unknown as Request;

            await hooksController.create(request);

            expect(await hooksController.delete(request))
            .toBeTruthy();

            expect(await hooksController.delete(request))
            .toBeFalsy();
        });

        it('Missing flux_id', async () => {
            let request = {
                body: {
                    webhook_id: 0
                }
            } as unknown as Request;

            await expect(hooksController.delete(request))
            .rejects
            .toThrow(HttpException);
        });

        it('Missing webhook_id', async () => {
            let request = {
                body: {
                    flux_id: 0
                }
            } as unknown as Request;

            await expect(hooksController.delete(request))
            .rejects
            .toThrow(HttpException);
        });
    });
});