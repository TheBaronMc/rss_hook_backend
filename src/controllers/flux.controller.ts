import { Controller, Logger, Delete, Get, HttpException, HttpStatus, Patch, Post, Req, OnModuleDestroy } from '@nestjs/common';
import { FluxService } from '../services/flux.service';
import { HooksService } from '../services/hooks.service';
import { DeliveryService } from '../services/deliveries.service';
import { ArticleService } from '../services/articles.service';

import { Flux, Prisma } from '@prisma/client';

import { Request } from 'express';

import RssFeedEmitter = require('rss-feed-emitter');
import { XMLParser } from 'fast-xml-parser';
import axios from 'axios';

@Controller('flux')
export class FluxController implements OnModuleDestroy {
    private readonly logger = new Logger(FluxController.name);

    private feeder: RssFeedEmitter = new RssFeedEmitter({ skipFirstLoad: true });

    constructor(private readonly fluxService: FluxService,
        private readonly hookService: HooksService,
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
        let response = await axios.get(request.body.url);
        let parser = new XMLParser({
            ignoreAttributes: false,
            alwaysCreateTextNode: true,
            ignoreDeclaration: true,
            parseAttributeValue: true
        });
        let feed = parser.parse(response.data);

        // TODO: Remove this hotfix and use a true feed parser
        let root = feed['rss'];
        if (root) {
            if (root['@_version'] != 2.0) {
                this.logger.debug(`Request error - ${request.body.url} is an invalid feed`);
                throw new HttpException('Invalid feed', HttpStatus.FORBIDDEN);
            }
        } else {
            this.logger.debug(`Request error - ${request.body.url} is an invalid feed`);
            throw new HttpException('Invalid feed', HttpStatus.FORBIDDEN);
        }

        let flux;
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


        let event = `flux${flux.id}`;

        this.feeder.add({
            url: flux.url,
            refresh: 2000,
            eventName: event
        });

        this.feeder.addListener(event, this.onNewItem(flux));
        
        return flux
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

        let flux_id: number = parseInt(request.body.id);
        if (isNaN(flux_id)) {
            this.logger.debug('Request error - Id must be a number');
            throw new HttpException('Flux id has to be a number', HttpStatus.FORBIDDEN);
        }

        if (!await this.exist(flux_id)) {
            this.logger.debug(`Request error - ${flux_id} doesn't exists`);
            throw new HttpException('This id doesn\'t exist', HttpStatus.FORBIDDEN);
        }
        
        // Removing all hooks
        let hooks = await this.hookService.get_hooks(flux_id);
        for (let hook of hooks)
            await this.hookService.delete_hook(flux_id, hook.id)

        // Removing all articles and deliveries
        let articles = await this.articleService.getArticlesSendedBy(flux_id);
        
        for (let article of articles)
            await this.devliveryService.deleteDeleveriesOf(article.id);

        await this.articleService.deleteArticlesOf(flux_id);

        let deleted_flux = await this.fluxService.deleteFlux(flux_id);
        this.feeder.remove(deleted_flux.url);

        this.logger.log(`${deleted_flux.url} deleted`)

        return deleted_flux;
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

        const old_flux = await this.fluxService.getFlux(request.body.id);

        this.feeder.remove(old_flux.url);
        this.feeder.add({
            url: request.body.url,
            refresh: 2000,
            eventName: `flux${old_flux.id}`
        });

        return await this.fluxService.updateFlux(request.body.id, request.body.url);
    }

    private async exist(id: number): Promise<boolean> {
        return (await this.getAll()).some(flux => flux.id == id);
    }

    private onNewItem(flux: Flux) {
        return async (item) => {
            this.logger.log(`New article ${item.title} from ${flux.url}`)
            
            const created_article = await this.articleService.createArticle(
                item.title,
                flux.id,
                item.description,
                item.link
            );
            const webhooks = await this.hookService.get_hooks(flux.id);

            for (let webhook of webhooks) {
                this.devliveryService.createDelevery(webhook.id, created_article.id);
                
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
                    this.logger.log(`Article ${created_article.id} published to webhook ${webhook.id}`);
                } catch (error) {
                    this.logger.error(`Article ${created_article.id} not published to webhook ${webhook.id}`);
                }
            }
        };
    }

    onModuleDestroy() {
        this.feeder.removeAllListeners()
        this.feeder.destroy()
    }
}

