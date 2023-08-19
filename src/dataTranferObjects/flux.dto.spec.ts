import { ValidationPipe, ArgumentMetadata, HttpException } from '@nestjs/common';

import { CreateFluxDto, GetFluxDto, DeleteFluxDto, UpdateFluxDto } from './flux.dto';

describe('Flux Dto', () => {
    const validatorPipe = new ValidationPipe();

    describe('CreateFluxDto', () => {
        const transformMetadata: ArgumentMetadata = {
            metatype: CreateFluxDto,
            data: '',
            type: 'body',
        };

        it('Wrong URL', async () => {
            const createFluxDto = new CreateFluxDto();
            createFluxDto.url = 'Not A URL';
            
            await expect(validatorPipe.transform(createFluxDto, transformMetadata))
            .rejects
            .toThrow(HttpException);
        });

        it('Correct element', async () => {
            const createFluxDto = new CreateFluxDto();
            createFluxDto.url = 'http://toto.org';
            
            await validatorPipe.transform(createFluxDto, transformMetadata);
        });
    });

    describe('GetFluxDto', () => {
        const transformMetadata: ArgumentMetadata = {
            metatype: GetFluxDto,
            data: '',
            type: 'param',
        };

        it('Id inferior zero', async () => {
            const getFluxDto = new GetFluxDto();
            getFluxDto.id = -1;

            await expect(validatorPipe.transform(getFluxDto, transformMetadata))
            .rejects
            .toThrow(HttpException);
        });

        it('Id equal zero', async () => {
            const getFluxDto = new GetFluxDto();
            getFluxDto.id = 0;

            await expect(validatorPipe.transform(getFluxDto, transformMetadata))
            .rejects
            .toThrow(HttpException);
        });

        it('Correct element', async () => {
            const getFluxDto = new GetFluxDto();
            getFluxDto.id = 1;

            await validatorPipe.transform(getFluxDto, transformMetadata);
        });
    });

    describe('UpdateFluxDto', () => {
        const transformMetadata: ArgumentMetadata = {
            metatype: UpdateFluxDto,
            data: '',
            type: 'body',
        };

        it('Id inferior zero', async () => {
            const updateFluxDto = new UpdateFluxDto();
            updateFluxDto.id = -1;
            updateFluxDto.url = 'http://toto.org';

            await expect(validatorPipe.transform(updateFluxDto, transformMetadata))
            .rejects
            .toThrow(HttpException);
        });

        it('Id equal zero', async () => {
            const updateFluxDto = new UpdateFluxDto();
            updateFluxDto.id = 0;
            updateFluxDto.url = 'http://toto.org';

            await expect(validatorPipe.transform(updateFluxDto, transformMetadata))
            .rejects
            .toThrow(HttpException);
        });

        it('Wrong URL', async () => {
            const updateFluxDto = new UpdateFluxDto();
            updateFluxDto.id = 1;
            updateFluxDto.url = 'Not A URL';
            
            await expect(validatorPipe.transform(updateFluxDto, transformMetadata))
            .rejects
            .toThrow(HttpException);
        });

        it('Correct element', async () => {
            const updateFluxDto = new UpdateFluxDto();
            updateFluxDto.id = 1;
            updateFluxDto.url = 'http://toto.org';
            
            await validatorPipe.transform(updateFluxDto, transformMetadata);
        });
    });

    describe('DeleteFluxDto', () => {
        const transformMetadata: ArgumentMetadata = {
            metatype: DeleteFluxDto,
            data: '',
            type: 'body',
        };

        it('Id inferior zero', async () => {
            const deleteFluxDto = new DeleteFluxDto();
            deleteFluxDto.id = -1;

            await expect(validatorPipe.transform(deleteFluxDto, transformMetadata))
            .rejects
            .toThrow(HttpException);
        });

        it('Id inferior zero', async () => {
            const deleteFluxDto = new DeleteFluxDto();
            deleteFluxDto.id = 0;

            await expect(validatorPipe.transform(deleteFluxDto, transformMetadata))
            .rejects
            .toThrow(HttpException);
        });

        it('Correct element', async () => {
            const deleteFluxDto = new DeleteFluxDto();
            deleteFluxDto.id = 1;

            await validatorPipe.transform(deleteFluxDto, transformMetadata);
        });
    });
});