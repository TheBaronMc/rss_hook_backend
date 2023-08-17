import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Articles } from '@prisma/client';

@Injectable()
export class ArticleService {
    constructor(private prisma: PrismaService) {}

    /**
     * Returns all articles
     * @returns articles
     */
    async getArticles(): Promise<Articles[]> {
        return this.prisma.articles.findMany();
    }

    /**
     * Returns all articles sended by a specific rss flux
     * @param flux_id the id of the rss flux
     * @returns articles
     */
    async getArticlesSendedBy(fluxId: number): Promise<Articles[]> {
        return this.prisma.articles.findMany(
            {
                where: {
                    sourceId: fluxId
                }
            });
    }

    /**
     * Create an article
     * @param title name of the article
     * @param source_id the id of the rss flux which emitted the article
     * @param description (optional) desctription of the article
     * @param url the url where you can find the article
     * @returns the created article
     */
    async createArticle(title: string, sourceId: number, description?: string, url?: string): Promise<Articles> {
        return this.prisma.articles.create({
            data: {
                title,
                sourceId,
                description,
                url
            }
        });
    }

    /**
     * Deletes article
     * @param article_id article to delete
     * @returns True if deleted, false otherwise (maybe article doesn't exist)
     */
    async deleteArticle(articleId: number): Promise<Articles> {
        return this.prisma.articles.delete({
            where: {
                id: articleId
            }
        });
    }


    /**
     * Deletes all articles of a specific flux
     * @param flux_id 
     * @returns 
     */
    async deleteArticlesOf(fluxId: number): Promise<number> {
        const result = await this.prisma.articles.deleteMany({
            where: {
                sourceId: fluxId
            }
        })

        return result.count
    }

}