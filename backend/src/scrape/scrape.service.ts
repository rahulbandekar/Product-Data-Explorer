import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class ScrapeService implements OnModuleInit {
  constructor(
    @InjectQueue('scrape-navigation-queue')
    private readonly scrapeQueue: Queue,
  ) {}

  async onModuleInit() {
    // TEMP: auto-trigger navigation scrape ONCE at startup
    await this.enqueueNavigationScrape();
  }

  async enqueueNavigationScrape() {
    return this.scrapeQueue.add(
      'scrape-navigation',
      {},
      {
        removeOnComplete: true,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    );
  }
}
