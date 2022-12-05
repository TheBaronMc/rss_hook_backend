import { Controller, Delete, Get, HttpException, HttpStatus, Patch, Post, Req } from '@nestjs/common';
import { FluxService } from '../services/flux.service';
import { HooksService } from '../services/hooks.service';
import { DeliveryService } from '../services/deliveries.service';
import { ArticleService } from '../services/articles.service';

import { Flux } from '@prisma/client';

import { Request } from 'express';

import RssFeedEmitter = require('rss-feed-emitter');
import axios from 'axios';

@Controller('flux')
export class FluxController {

    private feeder: RssFeedEmitter = new RssFeedEmitter({ skipFirstLoad: true });

    constructor(private readonly fluxService: FluxService,
        private readonly hookService: HooksService,
        private readonly devliveryService: DeliveryService,
        private readonly articleService: ArticleService) {}

    @Post()
    async create(@Req() request: Request): Promise<Flux> {
        if (!request.body.url)
            throw new HttpException('A url is required', HttpStatus.FORBIDDEN);

        // Url format check
        try {
            new URL(request.body.url);
        } catch {
            throw new HttpException('Wrong url', HttpStatus.FORBIDDEN);
        }

        let flux = await this.fluxService.createFlux(request.body.url);


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
        if (!request.body.id)
            throw new HttpException('An id is required', HttpStatus.FORBIDDEN);

        let flux_id: number = parseInt(request.body.id);
        if (isNaN(flux_id))
            throw new HttpException('Flux id has to be a number', HttpStatus.FORBIDDEN);

        if (!await this.exist(flux_id))
        throw new HttpException('This id doesn\'t exist', HttpStatus.FORBIDDEN);
        
        // Removing all hooks
        let hooks = await this.hookService.get_hooks(flux_id);
        for (let hook of hooks)
            await this.hookService.delete_hook(flux_id, hook.id)

        // Removing all articles and deliveries
        let articles = await this.articleService.getArticlesSendedBy(flux_id);
        
        for (let article of articles)
            await this.devliveryService.deleteDeleveriesOf(article.id);

        await this.articleService.deleteArticlesOf(flux_id);

        /*
        clearInterval(this.rssFlux[flux_id]);
        this.rssFlux.delete(flux_id);
        */
        let deleted_flux = await this.fluxService.deleteFlux(flux_id);
        this.feeder.remove(deleted_flux.url);

        return deleted_flux;
    }

    @Patch()
    async update(@Req() request: Request): Promise<Flux> {
        if (!request.body.id)
            throw new HttpException('Missing id', HttpStatus.FORBIDDEN);
        if (!request.body.url)
            throw new HttpException('Missing url', HttpStatus.FORBIDDEN);

        if (!await this.exist(request.body.id))
            throw new HttpException('Wrong id', HttpStatus.FORBIDDEN);

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
            console.log('NEW ITEM!!!!!!!!!!!!');
            
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
                    console.log(`Article ${created_article.id} published to webhook ${webhook.id}`);
                } catch (error) {
                    console.log(`Article ${created_article.id} not published to webhook ${webhook.id}`);
                }
            }
        };
    }
}

