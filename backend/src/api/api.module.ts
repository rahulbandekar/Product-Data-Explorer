// backend/src/api/api.module.ts
import { Module } from '@nestjs/common';
import { NavigationController } from './controllers/navigation.controller';
import { CategoriesController } from './controllers/categories.controller';
import { ProductsController } from './controllers/products.controller';
import { ScrapeController } from './controllers/scrape.controller';
import { PrismaService } from '../prisma/prisma.service';
import { ScrapeQueueService } from '../scrape/services/scrape-queue.service';
import { ReviewsController } from './controllers/reviews.controller';
import { ScrapeJobsController } from './controllers/scrape-jobs.controller';
import { ViewHistoryController } from './controllers/view-history.controller';

@Module({
  controllers: [
    NavigationController,
    CategoriesController,
    ProductsController,
    ScrapeController,
    ReviewsController,
    ScrapeJobsController,
    ViewHistoryController,

  ],
  providers: [PrismaService, ScrapeQueueService],
})
export class ApiModule {}