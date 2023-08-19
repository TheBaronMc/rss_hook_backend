import { ValidationPipe, ArgumentMetadata, HttpException } from '@nestjs/common';

import { GetArticleDto } from './article.dto';

describe('Article Dto', () => {
    const validatorPipe = new ValidationPipe();

    describe('GetArticleDto', () => {
        const transformMetadata: ArgumentMetadata = {
            metatype: GetArticleDto,
            data: '',
            type: 'param',
        };

        it('Id inferior zero', async () => {
            const getArticleDto = new GetArticleDto();
            getArticleDto.id = -1;

            await expect(validatorPipe.transform(getArticleDto, transformMetadata))
            .rejects
            .toThrow(HttpException);
        });

        it('Id equal zero', async () => {
            const getArticleDto = new GetArticleDto();
            getArticleDto.id = 0;

            await expect(validatorPipe.transform(getArticleDto, transformMetadata))
            .rejects
            .toThrow(HttpException);
        });

        it('Correct element', async () => {
            const getArticleDto = new GetArticleDto();
            getArticleDto.id = 1;

            await validatorPipe.transform(getArticleDto, transformMetadata);
        });
    });

});