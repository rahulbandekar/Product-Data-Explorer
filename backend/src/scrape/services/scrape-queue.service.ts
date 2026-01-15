// backend/src/scrape/services/scrape-queue.service.ts
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { PrismaService } from '../../prisma/prisma.service';

interface NavigationScrapeOptions {
  force?: boolean;
}

interface CategoryScrapeOptions {
  force?: boolean;
}

interface ProductScrapeOptions {
  force?: boolean;
  url?: string;
}

@Injectable()
export class ScrapeQueueService {
  private queue: Queue;

  constructor(private readonly prisma: PrismaService) {
    const connection = new IORedis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: null,
    });

    this.queue = new Queue('scrape-queue', { connection });
  }

  async addNavigationScrapeJob(options: NavigationScrapeOptions = {}) {
    return await this.queue.add('scrape-navigation', {
      type: 'navigation',
      force: options.force || false,
      timestamp: new Date().toISOString(),
    }, {
      jobId: `nav-${Date.now()}`,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    });
  }

  async addCategoryScrapeJob(navigationId: number, options: CategoryScrapeOptions = {}) {
    const navigation = await this.prisma.navigation.findUnique({
      where: { id: navigationId },
    });

    if (!navigation) {
      throw new Error(`Navigation ${navigationId} not found`);
    }

    return await this.queue.add('scrape-categories', {
      navigationId: navigation.id.toString(),
      navigationSlug: navigation.slug,
      navigationUrl: `https://www.worldofbooks.com/en-us/${navigation.slug}`,
      force: options.force || false,
      timestamp: new Date().toISOString(),
    }, {
      jobId: `cat-${navigationId}-${Date.now()}`,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    });
  }

  async addProductScrapeJob(categoryId: number, options: ProductScrapeOptions = {}) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
      include: { navigation: true },
    });

    if (!category) {
      throw new Error(`Category ${categoryId} not found`);
    }

    const url = options.url || `https://www.worldofbooks.com/en-us/${category.navigation.slug}/${category.slug}`;

    return await this.queue.add('scrape-products', {
      categoryId: category.id.toString(),
      categorySlug: category.slug,
      categoryUrl: url,
      force: options.force || false,
      timestamp: new Date().toISOString(),
    }, {
      jobId: `prod-${categoryId}-${Date.now()}`,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    });
  }

  async addProductDetailScrapeJob(productId: number, options: ProductScrapeOptions = {}) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    return await this.queue.add('scrape-product-detail', {
      productId: product.id.toString(),
      productUrl: product.sourceUrl,
      force: options.force || false,
      timestamp: new Date().toISOString(),
    }, {
      jobId: `detail-${productId}-${Date.now()}`,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    });
  }
}