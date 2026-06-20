import 'dotenv/config';
import { Worker, Queue } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { getRedisConnection } from '../../common/redis-connection';

const prisma = new PrismaClient();
const connection = getRedisConnection();
const detailQueue = new Queue('scrape-queue', { connection });

process.on('uncaughtException', (err) => console.error('Uncaught:', err));
process.on('unhandledRejection', (err) => console.error('Unhandled:', err));

console.log('Product worker starting...');

interface ScrapedProduct {
  title: string;
  author: string | null;
  imageUrl: string | null;
  sourceUrl: string;
  sourceId: string;
}

async function scrapeProductsHttp(
  categoryUrl: string,
): Promise<ScrapedProduct[]> {
  const res = await axios.get(categoryUrl, {
    timeout: 15000,
    maxRedirects: 5,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });

  const html: string = res.data;
  const products: ScrapedProduct[] = [];
  const seen = new Set<string>();

  const productLinkRegex =
    /<a[^>]+href=["']([^"']*\/products\/[^"'?#]+)["'][^>]*>/gi;
  let match: RegExpExecArray | null;

  while ((match = productLinkRegex.exec(html)) !== null) {
    const href = match[1];
    const fullUrl = href.startsWith('http')
      ? href
      : `https://www.worldofbooks.com${href.startsWith('/') ? href : '/' + href}`;
    if (seen.has(fullUrl)) continue;
    seen.add(fullUrl);

    const handle = fullUrl.match(/\/products\/([^/?#]+)/)?.[1] ?? fullUrl;

    // Look at a window of HTML around the match for title/author/image —
    // World of Books renders these right next to each product card link.
    const contextStart = Math.max(0, match.index - 600);
    const context = html.slice(contextStart, match.index + 600);

    const titleMatch =
      context.match(/>([^<]{3,120})<\/a>/) ||
      context.match(/alt=["']([^"']{3,120})["']/);
    const title = titleMatch
      ? titleMatch[1].replace(/\s+/g, ' ').trim()
      : 'Untitled Product';

    const authorMatch =
      context.match(/Author:\s*<\/?[^>]*>?\s*([^<]{2,80})</i) ||
      context.match(/Author:\s*([^<\n]{2,80})/i);
    const author = authorMatch ? authorMatch[1].trim() : null;

    const imageMatch = context.match(
      /src=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i,
    );
    const imageUrl = imageMatch
      ? imageMatch[1].startsWith('http')
        ? imageMatch[1]
        : `https:${imageMatch[1]}`
      : null;

    products.push({
      title,
      author,
      imageUrl,
      sourceUrl: fullUrl,
      sourceId: handle,
    });
    if (products.length >= 48) break;
  }

  return products;
}

const worker = new Worker(
  'scrape-queue',
  async (job) => {
    if (job.name !== 'scrape-products') return;

    const { categoryId, categoryUrl, force = false } = job.data;
    console.log(`Product scrape for category ${categoryId}: ${categoryUrl}`);

    const scrapeJob = await prisma.scrapeJob.create({
      data: {
        targetUrl: categoryUrl,
        targetType: 'products',
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    try {
      if (!force) {
        const latest = await prisma.product.findFirst({
          where: { categoryId: parseInt(categoryId) },
          orderBy: { lastScrapedAt: 'desc' },
        });
        if (latest?.lastScrapedAt) {
          const age = Date.now() - latest.lastScrapedAt.getTime();
          if (age < 24 * 60 * 60 * 1000) {
            console.log('Products fresh, skipping');
            await prisma.scrapeJob.update({
              where: { id: scrapeJob.id },
              data: { status: 'SKIPPED', finishedAt: new Date() },
            });
            return;
          }
        }
      }

      console.log(`Fetching ${categoryUrl}...`);
      const scraped = await scrapeProductsHttp(categoryUrl);
      console.log(`Found ${scraped.length} products via HTTP`);

      let count = 0;
      const detailTargets: number[] = [];

      for (const p of scraped) {
        if (!p.sourceId) continue;
        try {
          const saved = await prisma.product.upsert({
            where: { sourceId: p.sourceId },
            update: {
              title: p.title,
              author: p.author ?? undefined,
              imageUrl: p.imageUrl ?? undefined,
              categoryId: parseInt(categoryId),
              lastScrapedAt: new Date(),
            },
            create: {
              title: p.title,
              author: p.author,
              price: null,
              currency: null,
              imageUrl: p.imageUrl,
              sourceUrl: p.sourceUrl,
              sourceId: p.sourceId,
              categoryId: parseInt(categoryId),
              lastScrapedAt: new Date(),
            },
          });
          count++;
          detailTargets.push(saved.id);
        } catch (e) {
          console.error(`Error saving product "${p.title}":`, e);
        }
      }

      // Cascade into detail scraping so price/description/rating backfill
      // automatically, rate-limited by the detail worker's own limiter.
      for (const productId of detailTargets.slice(0, 20)) {
        await detailQueue.add(
          'scrape-product-detail',
          {
            productId: String(productId),
            force: false,
            timestamp: new Date().toISOString(),
          },
          {
            jobId: `detail-${productId}-${Date.now()}`,
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
          },
        );
      }

      await prisma.scrapeJob.update({
        where: { id: scrapeJob.id },
        data: { status: 'SUCCESS', finishedAt: new Date() },
      });
      console.log(
        `Product scraping done. ${count} saved, ${Math.min(20, detailTargets.length)} queued for detail enrichment.`,
      );
    } catch (error) {
      console.error('Product scraping failed:', error);
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
  { connection, limiter: { max: 1, duration: 2000 } },
);

worker.on('completed', (job) => console.log(`Job ${job.id} completed`));
worker.on('failed', (job, err) => console.error(`Job ${job?.id} failed:`, err));
console.log('Product worker listening...');
