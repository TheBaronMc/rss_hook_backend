import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Articles } from '@prisma/client';
import internal from 'stream';

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
    async getArticlesSendedBy(flux_id: number): Promise<Articles[]> {
        return (await this.prisma.articles.findMany(
            {
                where: {
                    sourceId: flux_id
                }
            }));
    }

    /**
     * Create an article
     * @param title name of the article
     * @param source_id the id of the rss flux which emitted the article
     * @param description (optional) desctription of the article
     * @param url the url where you can find the article
     * @returns the created article
     */
    async createArticle(title: string, source_id: number, description?: string, url?: string): Promise<Articles> {
        return this.prisma.articles.create({
            data: {
                title,
                sourceId: source_id,
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
    async deleteArticle(article_id: number) {
        try {
            await this.prisma.articles.delete({
                where: {
                    id: article_id
                }
            });
            return true;
        } catch {
            return false;
        }
    }


    /**
     * Deletes all articles of a specific flux
     * @param flux_id 
     * @returns 
     */
    async deleteArticlesOf(flux_id: number) {
        try {
            await this.prisma.articles.deleteMany({
                where: {
                    sourceId: flux_id
                }
            });
            return true;
        } catch {
            return false;
        }
    }

}