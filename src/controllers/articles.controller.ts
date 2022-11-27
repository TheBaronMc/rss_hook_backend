import { Controller, Get, HttpException, HttpStatus, Req } from '@nestjs/common';
import { ArticleService } from '../services/articles.service';

import { Articles } from '@prisma/client';

import { Request } from 'express';

@Controller()
export class ArticleController {

    constructor(private readonly articleService: ArticleService) {}
    
    @Get()
    async getAll(): Promise<Articles[]> {
        return this.articleService.getArticles();
    }

    @Get('flux')
    async getAllByFlux(@Req() request: Request): Promise<Articles[]> {
        if (!request.query.id)
            throw new HttpException('An article id is required', HttpStatus.FORBIDDEN);
    
        let id = parseInt(request.query.id as string);
        if (isNaN(id))
            throw new HttpException('An article id is a number', HttpStatus.FORBIDDEN);

        return this.articleService.getArticlesSendedBy(id);
    }

}