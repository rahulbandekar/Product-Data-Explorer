import 'dotenv/config';
import { Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { getRedisConnection } from '../../common/redis-connection';

const prisma = new PrismaClient();

process.on('uncaughtException', (err) => console.error('Uncaught:', err));
process.on('unhandledRejection', (err) => console.error('Unhandled:', err));

console.log('Product detail worker starting...');

function extractJsonLdProduct(html: string): any | null {
  const blocks = html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  for (const m of blocks) {
    try {
      const parsed = JSON.parse(m[1].trim());
      const candidates = Array.isArray(parsed)
        ? parsed
        : parsed['@graph'] || [parsed];
      const product = candidates.find(
        (c: any) =>
          c['@type'] === 'Product' ||
          (Array.isArray(c['@type']) && c['@type'].includes('Product')),
      );
      if (product) return product;
    } catch {
      // malformed block — skip it
    }
  }
  return null;
}

async function scrapeProductDetailHttp(url: string) {
  const res = await axios.get(url, {
    timeout: 15000,
    maxRedirects: 5,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });
  const html: string = res.data;

  const ld = extractJsonLdProduct(html);
  if (ld) {
    const offer = Array.isArray(ld.offers) ? ld.offers[0] : ld.offers;
    const image = Array.isArray(ld.image) ? ld.image[0] : ld.image;
    const rating = ld.aggregateRating;

    return {
      description: typeof ld.description === 'string' ? ld.description : null,
      author: ld.author?.name ?? ld.brand?.name ?? null,
      price: offer?.price ? parseFloat(offer.price) : null,
      currency: offer?.priceCurrency ?? null,
      imageUrl: image ?? null,
      ratingsAvg: rating?.ratingValue ? parseFloat(rating.ratingValue) : null,
      reviewsCount: rating?.reviewCount ? parseInt(rating.reviewCount) : null,
      specs: { sku: ld.sku ?? null, isbn: ld.isbn ?? ld.gtin13 ?? null },
    };
  }

  // Fallback if JSON-LD isn't present
  const metaDescMatch = html.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
  );
  return {
    description: metaDescMatch ? metaDescMatch[1].trim() : null,
    author: null,
    price: null,
    currency: null,
    imageUrl: null,
    ratingsAvg: null,
    reviewsCount: null,
    specs: {},
  };
}

const worker = new Worker(
  'scrape-product-detail-queue',
  async (job) => {
    if (job.name !== 'scrape-product-detail') return;

    const productId = parseInt(job.data.productId);
    const force = job.data.force ?? false;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { detail: true },
    });
    if (!product) {
      console.warn(`Product ${productId} not found, skipping detail scrape`);
      return;
    }

    console.log(`Product detail scrape for ${productId}: ${product.sourceUrl}`);
    const scrapeJob = await prisma.scrapeJob.create({
      data: {
        targetUrl: product.sourceUrl,
        targetType: 'product-detail',
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    try {
      if (!force && product.detail?.updatedAt) {
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

      const result = await scrapeProductDetailHttp(product.sourceUrl);

      await prisma.productDetail.upsert({
        where: { productId },
        update: {
          description: result.description ?? '',
          specs: result.specs,
          ratingsAvg: result.ratingsAvg,
          reviewsCount: result.reviewsCount,
        },
        create: {
          productId,
          description: result.description ?? '',
          specs: result.specs,
          ratingsAvg: result.ratingsAvg,
          reviewsCount: result.reviewsCount,
        },
      });

      // Backfill price/author/image on the Product row if we found better data
      await prisma.product.update({
        where: { id: productId },
        data: {
          price: result.price ?? product.price,
          currency: result.currency ?? product.currency,
          imageUrl: result.imageUrl ?? product.imageUrl,
          author: result.author ?? product.author,
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
    connection: getRedisConnection(),
    limiter: { max: 1, duration: 3000 },
  },
);

worker.on('completed', (job) => console.log(`Job ${job.id} completed`));
worker.on('failed', (job, err) => console.error(`Job ${job?.id} failed:`, err));
console.log('Product detail worker listening...');
