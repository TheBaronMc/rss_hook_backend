import { ValidationPipe, ArgumentMetadata, HttpException } from '@nestjs/common';

import { CreateBindingDto, GetWebhookBindingsDto, GetFluxBindingsDto, DeleteBindingDto } from '../dataTranferObjects/binding.dto';

describe('Binding Dto', () => {
    const validatorPipe = new ValidationPipe();

    describe('CreateBindingDto', () => {
        const transformMetadata: ArgumentMetadata = {
            metatype: CreateBindingDto,
            data: '',
            type: 'body',
        };

        it('Flux id inferior zero', async () => {
            const createBindingDto = new CreateBindingDto();
            createBindingDto.fluxId = -1;
            createBindingDto.webhookId = 1;
            
            await expect(validatorPipe.transform(createBindingDto, transformMetadata))
            .rejects
            .toThrow(HttpException);
        });

        it('Flux id equal zero', async () => {
            const createBindingDto = new CreateBindingDto();
            createBindingDto.fluxId = 0;
            createBindingDto.webhookId = 1;
            
            await expect(validatorPipe.transform(createBindingDto, transformMetadata))
            .rejects
            .toThrow(HttpException);
        });

        it('Webhook id inferio zero', async () => {
            const createBindingDto = new CreateBindingDto();
            createBindingDto.fluxId = 1;
            createBindingDto.webhookId = -1;
            
            await expect(validatorPipe.transform(createBindingDto, transformMetadata))
            .rejects
            .toThrow(HttpException);
        });

        it('Webhook id equal zero', async () => {
            const createBindingDto = new CreateBindingDto();
            createBindingDto.fluxId = 1;
            createBindingDto.webhookId = 0;
            
            await expect(validatorPipe.transform(createBindingDto, transformMetadata))
            .rejects
            .toThrow(HttpException);
        });

        it('Correct Dto', async () => {
            const createBindingDto = new CreateBindingDto();
            createBindingDto.fluxId = 1;
            createBindingDto.webhookId = 1;
            
            await validatorPipe.transform(createBindingDto, transformMetadata);
        });
    });

    describe('GetWebhookBindingsDto', () => {
        const transformMetadata: ArgumentMetadata = {
            metatype: GetWebhookBindingsDto,
            data: '',
            type: 'param',
        };

        it('Id inferior zero', async () => {
            const getWebhookBindingsDto = new GetWebhookBindingsDto();
            getWebhookBindingsDto.id = -1;

            await expect(validatorPipe.transform(getWebhookBindingsDto, transformMetadata))
            .rejects
            .toThrow(HttpException);
        });

        it('Id equal zero', async () => {
            const getWebhookBindingsDto = new GetWebhookBindingsDto();
            getWebhookBindingsDto.id = 0;

            await expect(validatorPipe.transform(getWebhookBindingsDto, transformMetadata))
            .rejects
            .toThrow(HttpException);
        });

        it('Correct element', async () => {
            const getWebhookBindingsDto = new GetWebhookBindingsDto();
            getWebhookBindingsDto.id = 1;

            await validatorPipe.transform(getWebhookBindingsDto, transformMetadata);
        });
    });

    describe('GetFluxBindingsDto', () => {
        const transformMetadata: ArgumentMetadata = {
            metatype: GetFluxBindingsDto,
            data: '',
            type: 'param',
        };

        it('Id inferior zero', async () => {
            const getFluxBindingsDto = new GetFluxBindingsDto();
            getFluxBindingsDto.id = -1;

            await expect(validatorPipe.transform(getFluxBindingsDto, transformMetadata))
            .rejects
            .toThrow(HttpException);
        });

        it('Id equal zero', async () => {
            const getFluxBindingsDto = new GetFluxBindingsDto();
            getFluxBindingsDto.id = 0;

            await expect(validatorPipe.transform(getFluxBindingsDto, transformMetadata))
            .rejects
            .toThrow(HttpException);
        });

        it('Correct element', async () => {
            const getFluxBindingsDto = new GetFluxBindingsDto();
            getFluxBindingsDto.id = 1;

            await validatorPipe.transform(getFluxBindingsDto, transformMetadata);
        });
    });

    describe('DeleteBindingDto', () => {
        const transformMetadata: ArgumentMetadata = {
            metatype: DeleteBindingDto,
            data: '',
            type: 'body',
        };

        it('Flux id inferior zero', async () => {
            const deleteBindingDto = new DeleteBindingDto();
            deleteBindingDto.fluxId = -1;
            deleteBindingDto.webhookId = 1;
            
            await expect(validatorPipe.transform(deleteBindingDto, transformMetadata))
            .rejects
            .toThrow(HttpException);
        });

        it('Flux id equal zero', async () => {
            const deleteBindingDto = new DeleteBindingDto();
            deleteBindingDto.fluxId = 0;
            deleteBindingDto.webhookId = 1;
            
            await expect(validatorPipe.transform(deleteBindingDto, transformMetadata))
            .rejects
            .toThrow(HttpException);
        });

        it('Webhook id inferio zero', async () => {
            const deleteBindingDto = new DeleteBindingDto();
            deleteBindingDto.fluxId = 1;
            deleteBindingDto.webhookId = -1;
            
            await expect(validatorPipe.transform(deleteBindingDto, transformMetadata))
            .rejects
            .toThrow(HttpException);
        });

        it('Webhook id equal zero', async () => {
            const deleteBindingDto = new DeleteBindingDto();
            deleteBindingDto.fluxId = 1;
            deleteBindingDto.webhookId = 0;
            
            await expect(validatorPipe.transform(deleteBindingDto, transformMetadata))
            .rejects
            .toThrow(HttpException);
        });

        it('Correct Dto', async () => {
            const deleteBindingDto = new DeleteBindingDto();
            deleteBindingDto.fluxId = 1;
            deleteBindingDto.webhookId = 1;
            
            await validatorPipe.transform(deleteBindingDto, transformMetadata);
        });
    });

});