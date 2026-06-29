import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
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

// Parses REDIS_URL or falls back to host/port — same logic as app.module.ts
function getRedisConnection() {
  const redisUrl = process.env.REDIS_URL;

  if (redisUrl) {
    try {
      const normalised = redisUrl.startsWith('redis')
        ? redisUrl
        : `redis://${redisUrl}`;
      const url = new URL(normalised);

      return {
        host: url.hostname,
        port: parseInt(url.port || '6379'),
        ...(url.password ? { password: decodeURIComponent(url.password) } : {}),
        ...(url.username && url.username !== 'default'
          ? { username: url.username }
          : {}),
        ...(normalised.startsWith('rediss://') ? { tls: {} } : {}),
        maxRetriesPerRequest: null as null,
      };
    } catch {
      const [host, port] = redisUrl.split(':');
      return {
        host,
        port: parseInt(port || '6379'),
        maxRetriesPerRequest: null as null,
      };
    }
  }

  return {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null as null,
  };
}

@Injectable()
export class ScrapeQueueService {
  private navigationQueue: Queue;
  private categoriesQueue: Queue;
  private productsQueue: Queue;
  private productDetailQueue: Queue;

  constructor(private readonly prisma: PrismaService) {
    const connection = getRedisConnection();
    this.navigationQueue = new Queue('scrape-navigation-queue', { connection });
    this.categoriesQueue = new Queue('scrape-categories-queue', { connection });
    this.productsQueue = new Queue('scrape-products-queue', { connection });
    this.productDetailQueue = new Queue('scrape-product-detail-queue', {
      connection,
    });
  }

  async addNavigationScrapeJob(options: NavigationScrapeOptions = {}) {
    return await this.navigationQueue.add(
      'scrape-navigation',
      {
        type: 'navigation',
        force: options.force || false,
        timestamp: new Date().toISOString(),
      },
      {
        jobId: `nav-${Date.now()}`,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    );
  }

  async addCategoryScrapeJob(
    navigationId: number,
    options: CategoryScrapeOptions = {},
  ) {
    const navigation = await this.prisma.navigation.findUnique({
      where: { id: navigationId },
    });
    if (!navigation) throw new Error(`Navigation ${navigationId} not found`);

    return await this.categoriesQueue.add(
      'scrape-categories',
      {
        navigationId: navigation.id.toString(),
        navigationSlug: navigation.slug,
        navigationUrl:
          navigation.sourceUrl ||
          `https://www.worldofbooks.com/pages/${navigation.slug}`,
        force: options.force || false,
        timestamp: new Date().toISOString(),
      },
      {
        jobId: `cat-${navigationId}-${Date.now()}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      },
    );
  }

  async addProductScrapeJob(
    categoryId: number,
    options: ProductScrapeOptions = {},
  ) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });
    if (!category) throw new Error(`Category ${categoryId} not found`);

    const url =
      options.url ||
      category.sourceUrl ||
      `https://www.worldofbooks.com/collections/${category.slug}`;

    return await this.productsQueue.add(
      'scrape-products',
      {
        categoryId: category.id.toString(),
        categorySlug: category.slug,
        categoryUrl: url,
        force: options.force || false,
        timestamp: new Date().toISOString(),
      },
      {
        jobId: `prod-${categoryId}-${Date.now()}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      },
    );
  }

  async addProductDetailScrapeJob(
    productId: number,
    options: ProductScrapeOptions = {},
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    return await this.productDetailQueue.add(
      'scrape-product-detail',
      {
        productId: product.id.toString(),
        productUrl: product.sourceUrl,
        force: options.force || false,
        timestamp: new Date().toISOString(),
      },
      {
        jobId: `detail-${productId}-${Date.now()}`,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    );
  }
}
