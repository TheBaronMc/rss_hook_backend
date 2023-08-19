import { ValidationPipe, ArgumentMetadata, HttpException } from '@nestjs/common';

import { GetDeliveryDstDto, GetDeliverySrcDto } from './delivery.dto';

describe('Delivery Dto', () => {
    const validatorPipe = new ValidationPipe();

    describe('GetDeliverySrcDto', () => {
        const transformMetadata: ArgumentMetadata = {
            metatype: GetDeliverySrcDto,
            data: '',
            type: 'param',
        };

        it('Id inferior zero', async () => {
            const getDeliverySrcDto = new GetDeliverySrcDto();
            getDeliverySrcDto.id = -1;

            await expect(validatorPipe.transform(getDeliverySrcDto, transformMetadata))
            .rejects
            .toThrow(HttpException);
        });

        it('Id equal zero', async () => {
            const getDeliverySrcDto = new GetDeliverySrcDto();
            getDeliverySrcDto.id = 0;

            await expect(validatorPipe.transform(getDeliverySrcDto, transformMetadata))
            .rejects
            .toThrow(HttpException);
        });

        it('Correct element', async () => {
            const getDeliverySrcDto = new GetDeliverySrcDto();
            getDeliverySrcDto.id = 1;

            await validatorPipe.transform(getDeliverySrcDto, transformMetadata);
        });
    });

    describe('GetDeliveryDstDto', () => {
        const transformMetadata: ArgumentMetadata = {
            metatype: GetDeliveryDstDto,
            data: '',
            type: 'param',
        };

        it('Id inferior zero', async () => {
            const getDeliveryDstDto = new GetDeliveryDstDto();
            getDeliveryDstDto.id = -1;

            await expect(validatorPipe.transform(getDeliveryDstDto, transformMetadata))
            .rejects
            .toThrow(HttpException);
        });

        it('Id equal zero', async () => {
            const getDeliveryDstDto = new GetDeliveryDstDto();
            getDeliveryDstDto.id = 0;

            await expect(validatorPipe.transform(getDeliveryDstDto, transformMetadata))
            .rejects
            .toThrow(HttpException);
        });

        it('Correct element', async () => {
            const getDeliveryDstDto = new GetDeliveryDstDto();
            getDeliveryDstDto.id = 1;

            await validatorPipe.transform(getDeliveryDstDto, transformMetadata);
        });
    });

});