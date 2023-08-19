import { ValidationPipe, ArgumentMetadata, HttpException } from '@nestjs/common';

import { CreateWebhookDto, GetWebhookDto, DeleteWebhookDto, UpdateWebhookDto } from '../dataTranferObjects/webhook.dto';

describe('Webhook Dto', () => {
    const validatorPipe = new ValidationPipe();

    describe('CreateWebhookDto', () => {
        const transformMetadata: ArgumentMetadata = {
            metatype: CreateWebhookDto,
            data: '',
            type: 'body',
        };

        it('Wrong URL', async () => {
            const createWebhookDto = new CreateWebhookDto();
            createWebhookDto.url = 'Not A URL';
            
            await expect(validatorPipe.transform(createWebhookDto, transformMetadata))
            .rejects
            .toThrow(HttpException);
        });

        it('Correct element', async () => {
            const createWebhookDto = new CreateWebhookDto();
            createWebhookDto.url = 'http://toto.org';
            
            await validatorPipe.transform(createWebhookDto, transformMetadata);
        });
    });

    describe('GetWebhookDto', () => {
        const transformMetadata: ArgumentMetadata = {
            metatype: GetWebhookDto,
            data: '',
            type: 'param',
        };

        it('Id inferior zero', async () => {
            const getWebhookDto = new GetWebhookDto();
            getWebhookDto.id = -1;

            await expect(validatorPipe.transform(getWebhookDto, transformMetadata))
            .rejects
            .toThrow(HttpException);
        });

        it('Id equal zero', async () => {
            const getWebhookDto = new GetWebhookDto();
            getWebhookDto.id = 0;

            await expect(validatorPipe.transform(getWebhookDto, transformMetadata))
            .rejects
            .toThrow(HttpException);
        });

        it('Correct element', async () => {
            const getWebhookDto = new GetWebhookDto();
            getWebhookDto.id = 1;

            await validatorPipe.transform(getWebhookDto, transformMetadata);
        });
    });

    describe('UpdateWebhookDto', () => {
        const transformMetadata: ArgumentMetadata = {
            metatype: UpdateWebhookDto,
            data: '',
            type: 'body',
        };

        it('Id inferior zero', async () => {
            const updateWebhookDto = new UpdateWebhookDto();
            updateWebhookDto.id = -1;
            updateWebhookDto.url = 'http://toto.org';

            await expect(validatorPipe.transform(updateWebhookDto, transformMetadata))
            .rejects
            .toThrow(HttpException);
        });

        it('Id equal zero', async () => {
            const updateWebhookDto = new UpdateWebhookDto();
            updateWebhookDto.id = 0;
            updateWebhookDto.url = 'http://toto.org';

            await expect(validatorPipe.transform(updateWebhookDto, transformMetadata))
            .rejects
            .toThrow(HttpException);
        });

        it('Wrong URL', async () => {
            const updateWebhookDto = new UpdateWebhookDto();
            updateWebhookDto.id = 1;
            updateWebhookDto.url = 'Not A URL';
            
            await expect(validatorPipe.transform(updateWebhookDto, transformMetadata))
            .rejects
            .toThrow(HttpException);
        });

        it('Correct element', async () => {
            const updateWebhookDto = new UpdateWebhookDto();
            updateWebhookDto.id = 1;
            updateWebhookDto.url = 'http://toto.org';
            
            await validatorPipe.transform(updateWebhookDto, transformMetadata);
        });
    });

    describe('DeleteWebhookDto', () => {
        const transformMetadata: ArgumentMetadata = {
            metatype: DeleteWebhookDto,
            data: '',
            type: 'body',
        };

        it('Id inferior zero', async () => {
            const deleteWebhookDto = new DeleteWebhookDto();
            deleteWebhookDto.id = -1;

            await expect(validatorPipe.transform(deleteWebhookDto, transformMetadata))
            .rejects
            .toThrow(HttpException);
        });

        it('Id inferior zero', async () => {
            const deleteWebhookDto = new DeleteWebhookDto();
            deleteWebhookDto.id = 0;

            await expect(validatorPipe.transform(deleteWebhookDto, transformMetadata))
            .rejects
            .toThrow(HttpException);
        });

        it('Correct element', async () => {
            const deleteWebhookDto = new DeleteWebhookDto();
            deleteWebhookDto.id = 1;

            await validatorPipe.transform(deleteWebhookDto, transformMetadata);
        });
    });
});