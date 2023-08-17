import { Controller, Logger, Delete, Get, HttpException, HttpStatus, Patch, Post, Req, OnModuleDestroy, UseFilters } from '@nestjs/common';
import { FluxService } from '../services/flux.service';
import { BindingService } from '../services/bindings.service';
import { DeliveryService } from '../services/deliveries.service';
import { ArticleService } from '../services/articles.service';
import { PrismaClientKnownRequestErrorFilter } from '../exceptionFilters/prisma-client-known-request-error.filter';

import { Flux, Prisma } from '@prisma/client';

import { Request } from 'express';

import RssFeedEmitter = require('rss-feed-emitter');
import { XMLParser } from 'fast-xml-parser';
import axios from 'axios';

@Controller('flux')
@UseFilters(PrismaClientKnownRequestErrorFilter)
export class FluxController implements OnModuleDestroy {
    private readonly logger = new Logger(FluxController.name);

    private feeder: RssFeedEmitter = new RssFeedEmitter({ skipFirstLoad: true });

    constructor(private readonly fluxService: FluxService,
        private readonly bindingService: BindingService,
        private readonly devliveryService: DeliveryService,
        private readonly articleService: ArticleService) {}

    @Post()
    async create(@Req() request: Request): Promise<Flux> {
        if (!request.body.url) {
            this.logger.debug('Request error - No URL');
            throw new HttpException('A url is required', HttpStatus.FORBIDDEN);
        }

        // Url format check
        try {
            new URL(request.body.url);
        } catch {
            this.logger.debug(`Request error - ${request.body.url} not a url`);
            throw new HttpException('Wrong url', HttpStatus.FORBIDDEN);
        }

        // Is feed valid
        const response = await axios.get(request.body.url);
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
                this.logger.debug(`Request error - ${request.body.url} is an invalid feed`);
                throw new HttpException('Invalid feed', HttpStatus.FORBIDDEN);
            }
        } else {
            this.logger.debug(`Request error - ${request.body.url} is an invalid feed`);
            throw new HttpException('Invalid feed', HttpStatus.FORBIDDEN);
        }

        let flux: Flux;
        try {
            flux = await this.fluxService.createFlux(request.body.url);
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    this.logger.debug(`Request error - ${request.body.url} is already registered`);
                    throw new HttpException('This URL is already registered', HttpStatus.FORBIDDEN);
                }
            }
        }


        const event = `flux${flux.id}`;
        this.feeder.add({
            url: flux.url,
            refresh: 2000,
            eventName: event
        });

        this.feeder.addListener(event, this.onNewItem(flux));
        
        return flux;
    }
    
    @Get()
    async getAll(): Promise<Flux[]> {
        return this.fluxService.getAllFlux();
    }

    @Delete()
    async delete(@Req() request: Request): Promise<Flux> {
        if (!request.body.id) {
            this.logger.debug('Request error - No id');
            throw new HttpException('An id is required', HttpStatus.FORBIDDEN);
        }

        const fluxId: number = parseInt(request.body.id);
        if (isNaN(fluxId)) {
            this.logger.debug('Request error - Id must be a number');
            throw new HttpException('Flux id has to be a number', HttpStatus.FORBIDDEN);
        }

        if (!await this.exist(fluxId)) {
            this.logger.debug(`Request error - ${fluxId} doesn't exists`);
            throw new HttpException('This id doesn\'t exist', HttpStatus.FORBIDDEN);
        }
        
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
    async update(@Req() request: Request): Promise<Flux> {
        if (!request.body.id) {
            this.logger.debug(`Missiing id`);
            throw new HttpException('Missing id', HttpStatus.FORBIDDEN);
        }
        if (!request.body.url) {
            this.logger.debug(`Missiing url`);
            throw new HttpException('Missing url', HttpStatus.FORBIDDEN);
        }

        if (!await this.exist(request.body.id)) {
            this.logger.debug(`Wrond id`);
            throw new HttpException('Wrong id', HttpStatus.FORBIDDEN);
        }

        try {
            new URL(request.body.url);
        } catch {
            throw new HttpException('Wrong url', HttpStatus.FORBIDDEN);
        }

        const oldFlux = await this.fluxService.getFlux(request.body.id);

        this.feeder.remove(oldFlux.url);
        this.feeder.add({
            url: request.body.url,
            refresh: 2000,
            eventName: `flux${oldFlux.id}`
        });

        return await this.fluxService.updateFlux(request.body.id, request.body.url);
    }

    private async exist(id: number): Promise<boolean> {
        return (await this.getAll()).some(flux => flux.id == id);
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

