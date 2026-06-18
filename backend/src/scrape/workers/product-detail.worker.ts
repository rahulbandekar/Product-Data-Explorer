import 'dotenv/config';
import { Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

process.on('uncaughtException', (err) => console.error('Uncaught:', err));
process.on('unhandledRejection', (err) => console.error('Unhandled:', err));

console.log('Product detail worker starting (HTTP mode)...');

async function scrapeProductDetailHttp(url: string) {
  const res = await axios.get(url, {
    timeout: 15000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; ProductExplorerBot/1.0)',
      Accept: 'text/html,application/xhtml+xml',
    },
  });

  const html: string = res.data;

  // Best-effort extraction — description is usually in a meta tag or first <p>
  const metaDescMatch = html.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
  );
  const description = metaDescMatch ? metaDescMatch[1].trim() : null;

  return {
    description,
    specs: {},
    reviews: [] as Array<{ author: string; rating: number; text: string }>,
  };
}

const worker = new Worker(
  'scrape-queue',
  async (job) => {
    if (job.name !== 'scrape-product-detail') return;

    const { productId, productUrl, force = false } = job.data;
    console.log(`Product detail scrape for ${productId}: ${productUrl}`);

    const scrapeJob = await prisma.scrapeJob.create({
      data: {
        targetUrl: productUrl,
        targetType: 'product-detail',
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    try {
      if (!force) {
        const product = await prisma.product.findUnique({
          where: { id: parseInt(productId) },
          include: { detail: true },
        });

        if (product?.detail?.updatedAt) {
          const age = Date.now() - product.detail.updatedAt.getTime();
          if (age < 24 * 60 * 60 * 1000) {
            console.log('Detail fresh, skipping');
            await prisma.scrapeJob.update({
              where: { id: scrapeJob.id },
              data: { status: 'SKIPPED', finishedAt: new Date() },
            });
            return;
          }
        }
      }

      console.log(`Fetching ${productUrl}...`);
      const result = await scrapeProductDetailHttp(productUrl);

      await prisma.productDetail.upsert({
        where: { productId: parseInt(productId) },
        update: {
          description: result.description || '',
          specs: result.specs,
        },
        create: {
          productId: parseInt(productId),
          description: result.description || '',
          specs: result.specs,
          ratingsAvg: null,
          reviewsCount: 0,
        },
      });

      await prisma.scrapeJob.update({
        where: { id: scrapeJob.id },
        data: { status: 'SUCCESS', finishedAt: new Date() },
      });
      console.log(`Product detail scraping done for ${productId}`);
    } catch (error) {
      console.error('Product detail scraping failed:', error);
      await prisma.scrapeJob.update({
        where: { id: scrapeJob.id },
        data: {
          status: 'FAILED',
          errorLog: String(error).substring(0, 500),
          finishedAt: new Date(),
        },
      });
      throw error;
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    },
    limiter: { max: 1, duration: 3000 },
  },
);

worker.on('completed', (job) => console.log(`Job ${job.id} completed`));
worker.on('failed', (job, err) => console.error(`Job ${job?.id} failed:`, err));
worker.on('error', (err) => console.error('Worker error:', err));
console.log('Product detail worker listening...');
