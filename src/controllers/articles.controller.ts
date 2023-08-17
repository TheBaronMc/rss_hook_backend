import { Controller, Get, HttpException, HttpStatus, Req, UseFilters } from '@nestjs/common';
import { ArticleService } from '../services/articles.service';
import { PrismaClientKnownRequestErrorFilter } from '../exceptionFilters/prisma-client-known-request-error.filter';

import { Articles } from '@prisma/client';

import { Request } from 'express';

@Controller('articles')
@UseFilters(PrismaClientKnownRequestErrorFilter)
export class ArticleController {

    constructor(private readonly articleService: ArticleService) {}
    
    @Get()
    async getAll(): Promise<Articles[]> {
        return this.articleService.getArticles();
    }

    @Get('flux')
    async getAllByFlux(@Req() request: Request): Promise<Articles[]> {
        if (!request.query.id)
            throw new HttpException('An flux id is required', HttpStatus.FORBIDDEN);
    
        const id = parseInt(request.query.id as string);
        if (isNaN(id))
            throw new HttpException('A Flux id must a number', HttpStatus.FORBIDDEN);

        return this.articleService.getArticlesSendedBy(id);
    }

}