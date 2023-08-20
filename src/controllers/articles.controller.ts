import { Controller, Get, Param, UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import { ArticleService } from '../services/articles.service';
import { PrismaClientKnownRequestErrorFilter } from '../exceptionFilters/prisma-client-known-request-error.filter';

import { Articles } from '@prisma/client';

import { GetArticleDto } from '../dataTranferObjects/article.dto';

@Controller('articles')
@UseFilters(PrismaClientKnownRequestErrorFilter)
@UsePipes(new ValidationPipe({ transform: true }))
export class ArticleController {

    constructor(private readonly articleService: ArticleService) {}
    
    @Get()
    async getAll(): Promise<Articles[]> {
        return this.articleService.getArticles();
    }

    @Get('flux/:id')
    async getAllByFlux(@Param() getArticleDto: GetArticleDto): Promise<Articles[]> {
        return this.articleService.getArticlesSendedBy(getArticleDto.id);
    }

}