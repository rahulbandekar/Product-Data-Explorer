import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScrapeService } from './scrape.service';
import { ScrapeQueueService } from './services/scrape-queue.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'scrape-navigation-queue',
    }),
  ],
  providers: [ScrapeService, ScrapeQueueService],
  exports: [ScrapeService, ScrapeQueueService, BullModule],
})
export class ScrapeModule {}
