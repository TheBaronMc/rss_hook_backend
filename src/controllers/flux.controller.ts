import { Controller, Logger, Delete, Get, HttpException, HttpStatus, Patch, Post, OnModuleDestroy, UseFilters, Body, Param } from '@nestjs/common';
import { FluxService } from '../services/flux.service';
import { BindingService } from '../services/bindings.service';
import { DeliveryService } from '../services/deliveries.service';
import { ArticleService } from '../services/articles.service';
import { PrismaClientKnownRequestErrorFilter } from '../exceptionFilters/prisma-client-known-request-error.filter';

import { Flux } from '@prisma/client';

import RssFeedEmitter = require('rss-feed-emitter');
import { XMLParser } from 'fast-xml-parser';
import axios from 'axios';
import { CreateFluxDto, DeleteFluxDto, GetFluxDto, UpdateFluxDto } from '../dataTranferObjects/flux.dto';
import { NotFoundErrorFilter } from '../exceptionFilters/not-found-error.filter';

@Controller('flux')
@UseFilters(
    PrismaClientKnownRequestErrorFilter,
    NotFoundErrorFilter
)
export class FluxController implements OnModuleDestroy {
    private readonly logger = new Logger(FluxController.name);

    private feeder: RssFeedEmitter = new RssFeedEmitter({ skipFirstLoad: true });

    constructor(private readonly fluxService: FluxService,
        private readonly bindingService: BindingService,
        private readonly devliveryService: DeliveryService,
        private readonly articleService: ArticleService) {}

    @Post()
    async create(@Body() createFluxDto: CreateFluxDto): Promise<Flux> {
        // Is feed valid
        const response = await axios.get(createFluxDto.url);
        const parser = new XMLParser({
            ignoreAttributes: false,
            alwaysCreateTextNode: true,
            ignoreDeclaration: true,
            parseAttributeValue: true
        });
        const feed = parser.parse(response.data);

        // TODO: Remove this hotfix and use a true feed parser
        const root = feed['rss'];
        if (root) {
            if (root['@_version'] != 2.0) {
                this.logger.debug(`Request error - ${createFluxDto.url} is an invalid feed`);
                throw new HttpException('Invalid feed', HttpStatus.FORBIDDEN);
            }
        } else {
            this.logger.debug(`Request error - ${createFluxDto.url} is an invalid feed`);
            throw new HttpException('Invalid feed', HttpStatus.FORBIDDEN);
        }

        const flux: Flux = await this.fluxService.createFlux(createFluxDto.url);

        const event = `flux${flux.id}`;
        this.feeder.add({
            url: flux.url,
            refresh: 2000,
            eventName: event
        });

        this.feeder.addListener(event, this.onNewItem(flux));
        
        return flux;
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
            await this.devliveryService.deleteDeleveriesOf(article.id);

        await this.articleService.deleteArticlesOf(fluxId);

        const deletedFlux = await this.fluxService.deleteFlux(fluxId);
        this.feeder.remove(deletedFlux.url);

        this.logger.log(`${deletedFlux.url} deleted`);

        return deletedFlux;
    }

    @Patch()
    async update(@Body() updateFluxDto: UpdateFluxDto): Promise<Flux> {
        const oldFlux = await this.fluxService.getFlux(updateFluxDto.id);

        this.feeder.remove(oldFlux.url);
        this.feeder.add({
            url: updateFluxDto.url,
            refresh: 2000,
            eventName: `flux${oldFlux.id}`
        });

        return this.fluxService.updateFlux(updateFluxDto.id, updateFluxDto.url);
    }

    private onNewItem(flux: Flux) {
        return async (item: any): Promise<void> => {
            this.logger.log(`New article ${item.title} from ${flux.url}`);
            
            const createdArticle = await this.articleService.createArticle(
                item.title,
                flux.id,
                item.description,
                item.link
            );
            const webhooks = await this.bindingService.getAssociatedWebhooks(flux.id);

            for (const webhook of webhooks) {
                this.devliveryService.createDelevery(webhook.id, createdArticle.id);
                
                try {
                    await axios.post(webhook.url, {
                        embeds: [
                            { 
                                title: item.title,
                                type: 'rich',
                                description: item.description,
                                url: item.link 
                            }
                        ]
                    });
                    this.logger.log(`Article ${createdArticle.id} published to webhook ${webhook.id}`);
                } catch (error) {
                    this.logger.error(`Article ${createdArticle.id} not published to webhook ${webhook.id}`);
                }
            }
        };
    }

    onModuleDestroy(): void {
        this.feeder.removeAllListeners();
        this.feeder.destroy();
    }
}

