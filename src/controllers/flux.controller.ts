import { Controller, Logger, Delete, Get, HttpException, HttpStatus, Patch, Post, OnModuleDestroy, UseFilters, Body, Param, UsePipes, ValidationPipe } from '@nestjs/common';
import { FluxService } from '../services/flux.service';
import { BindingService } from '../services/bindings.service';
import { DeliveryService } from '../services/deliveries.service';
import { ArticleService } from '../services/articles.service';
import { PrismaClientKnownRequestErrorFilter } from '../exceptionFilters/prisma-client-known-request-error.filter';

import { Flux } from '@prisma/client';

import { CreateFluxDto, DeleteFluxDto, GetFluxDto, UpdateFluxDto } from '../dataTranferObjects/flux.dto';
import { NotFoundErrorFilter } from '../exceptionFilters/not-found-error.filter';
import { FeedManager } from '../rssFeed/manager/feedManager';
import axios from 'axios';

@Controller('flux')
@UseFilters(
    PrismaClientKnownRequestErrorFilter,
    NotFoundErrorFilter
)
@UsePipes(new ValidationPipe({ transform: true }))
export class FluxController implements OnModuleDestroy {
    private readonly logger = new Logger(FluxController.name);

    private feedManager: FeedManager;

    constructor(private readonly fluxService: FluxService,
        private readonly bindingService: BindingService,
        private readonly deliveryService: DeliveryService,
        private readonly articleService: ArticleService) {
        this.feedManager = new FeedManager();
    }

    @Post()
    async create(@Body() createFluxDto: CreateFluxDto): Promise<Flux> {
        await this.feedManager.addFeed(createFluxDto.url);

        const createdFlux = await this.fluxService.createFlux(createFluxDto.url);

        // Add listener
        this.feedManager.onNewItem(createFluxDto.url,
            await newArticleListener(createdFlux, 
                this.bindingService,
                this.articleService,
                this.deliveryService)
        );
        
        return createdFlux;
    }

    @Get(':id')
    async getFlux(@Param() getFluxDto: GetFluxDto): Promise<Flux> {
        return this.fluxService.getFlux(getFluxDto.id);
    }
    
    @Get()
    async getAll(): Promise<Flux[]> {
        return this.fluxService.getAllFlux();
    }

    @Delete()
    async delete(@Body() deleteFluxDto: DeleteFluxDto): Promise<Flux> {
        const fluxId = deleteFluxDto.id;
        
        // Removing all hooks
        const hooks = await this.bindingService.getAssociatedWebhooks(fluxId);
        for (const hook of hooks)
            await this.bindingService.deleteBinding(fluxId, hook.id);

        // Removing all articles and deliveries
        const articles = await this.articleService.getArticlesSendedBy(fluxId);
        
        for (const article of articles)
            await this.deliveryService.deleteDeleveriesOf(article.id);

        await this.articleService.deleteArticlesOf(fluxId);

        const deletedFlux = await this.fluxService.deleteFlux(fluxId);
        this.feedManager.removeFeed(deletedFlux.url);

        this.logger.log(`${deletedFlux.url} deleted`);

        return deletedFlux;
    }

    @Patch()
    async update(@Body() updateFluxDto: UpdateFluxDto): Promise<Flux> {
        const oldFlux = await this.fluxService.getFlux(updateFluxDto.id);

        await this.feedManager.updateFeed(oldFlux.url, updateFluxDto.url);

        return this.fluxService.updateFlux(updateFluxDto.id, updateFluxDto.url);
    }

    onModuleDestroy(): void {
        this.feedManager.destroy();
    }
}

async function newArticleListener(parentFlux: Flux, bindingService: BindingService, articleService: ArticleService, deliveryService: DeliveryService): Promise<(article: any) => Promise<void>> {
    return async (article): Promise<void> => {
        // Insert the article in the DB
        const createdArticle = await articleService.createArticle(
            article.title,
            parentFlux.id,
            article.description,
            article.link
        );

        // For each associated webhook, send the article
        const associatedWebhooks = await bindingService.getAssociatedWebhooks(parentFlux.id);
        
        for (const webhook of associatedWebhooks) {
            await deliveryService.createDelevery(webhook.id, createdArticle.id);

            try {
                await axios.post(webhook.url, {
                    embeds: [
                        {
                            title: article.title,
                            type: 'rich',
                            description: article.description,
                            url: article.link
                        }
                    ]
                });
            } catch (error) {
                continue;
            }
        }
    };
}
