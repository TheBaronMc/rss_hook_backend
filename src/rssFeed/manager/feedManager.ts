import RssFeedEmitter = require('rss-feed-emitter');
import { XMLParser } from 'fast-xml-parser';
import axios from 'axios';

export class FeedManager {
    private feeder: RssFeedEmitter = new RssFeedEmitter({ skipFirstLoad: true });

    public async addFeed(url: string, refreshTime?: number): Promise<void> {
        if (!await this.isFeed(url)) {
            throw new FeedParseError(`${url} is not an RSS feed`);
        }

        const feed = {
            url,
            refresh: refreshTime || 200,
            eventName: url
        };
        this.feeder.add(feed);
    }

    public async updateFeed(oldUrl: string, newUrl: string): Promise<void> {
        if (!this.isKnownFeed(oldUrl)) {
            new FeedUnknown(`${oldUrl} is an unknown feed`);
        }
        if (!await this.isFeed(newUrl)) {
            throw new FeedParseError(`${newUrl} is not an RSS feed`);
        }
        
        // Get all the listener from the old url
        const oldFeedListeners = this.feeder.listeners(oldUrl);

        // Remove old url and insert the new one
        this.removeFeed(oldUrl);
        await this.addFeed(newUrl);

        // Attach all listeners of the old url to the new one
        oldFeedListeners.forEach(listener => {
            this.onNewItem(newUrl, listener as (...args: any[]) => void);
        });
    }

    public removeFeed(url: string): void {
        if (!this.isKnownFeed(url)) {
            new FeedUnknown(`${url} is an unknown feed`);
        }
        this.feeder.remove(url);
    }

    public destroy(): void {
        this.feeder.destroy();
    }

    public onNewItem(url: string, listener: (...args: any[]) => void): void {
        if (!this.isKnownFeed(url)) {
            new FeedUnknown(`${url} is an unknown feed`);
        }
        this.feeder.on(url, listener);
    }

    private async isFeed(url: string): Promise<boolean> {
        const response = await axios.get(url);
        
        const parser = new XMLParser({
            ignoreAttributes: false,
            alwaysCreateTextNode: true,
            ignoreDeclaration: true,
            parseAttributeValue: true
        });
        const feed = parser.parse(response.data);

        const root = feed['rss'];

        return root && (root['@_version'] == 2.0);
    }

    private isKnownFeed(url: string): boolean {
        return this.feeder.list.some((feed) => feed.url == url);
    }
}

export class FeedParseError extends Error {}

export class FeedUnknown extends Error {}