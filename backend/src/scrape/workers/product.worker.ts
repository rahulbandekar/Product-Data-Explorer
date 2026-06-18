import 'dotenv/config';
import { Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

process.on('uncaughtException', (err) => console.error('Uncaught:', err));
process.on('unhandledRejection', (err) => console.error('Unhandled:', err));

console.log('Product worker starting (HTTP mode)...');

interface ScrapedProduct {
  title: string;
  author: string | null;
  price: number;
  imageUrl: string;
  sourceUrl: string;
  sourceId: string;
}

async function scrapeProductsHttp(
  categoryUrl: string,
): Promise<ScrapedProduct[]> {
  const res = await axios.get(categoryUrl, {
    timeout: 15000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; ProductExplorerBot/1.0)',
      Accept: 'text/html,application/xhtml+xml',
    },
  });

  const html: string = res.data;
  const products: ScrapedProduct[] = [];

  // Match product links with surrounding context (title, price, image)
  // worldofbooks.com product URLs typically look like /products/<slug>-<id>
  const productLinkRegex =
    /<a[^>]+href=["']([^"']*\/products\/[^"']+)["'][^>]*>/gi;
  const seen = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = productLinkRegex.exec(html)) !== null) {
    const href = match[1];
    const fullUrl = href.startsWith('http')
      ? href
      : `https://www.worldofbooks.com${href.startsWith('/') ? href : '/' + href}`;

    if (seen.has(fullUrl)) continue;
    seen.add(fullUrl);

    const idMatch = fullUrl.match(/[?/]([a-zA-Z0-9-]+)\/?$/);
    const sourceId = idMatch ? idMatch[1] : fullUrl;

    // Try to find a title near this link in the HTML
    const context = html.slice(match.index, match.index + 500);
    const titleMatch = context.match(/>([^<]{3,100})<\/a>/);
    const title = titleMatch ? titleMatch[1].trim() : 'Untitled Product';

    products.push({
      title,
      author: null,
      price: 0,
      imageUrl: '',
      sourceUrl: fullUrl,
      sourceId,
    });

    if (products.length >= 30) break;
  }

  return products;
}

const worker = new Worker(
  'scrape-queue',
  async (job) => {
    if (job.name !== 'scrape-products') {
      console.log(`Skipping: ${job.name}`);
      return;
    }

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
      for (const p of scraped) {
        if (!p.sourceId) continue;
        try {
          await prisma.product.upsert({
            where: { sourceId: p.sourceId },
            update: {
              title: p.title,
              categoryId: parseInt(categoryId),
              lastScrapedAt: new Date(),
            },
            create: {
              title: p.title,
              author: p.author,
              price: p.price || null,
              currency: 'GBP',
              imageUrl: p.imageUrl || null,
              sourceUrl: p.sourceUrl,
              sourceId: p.sourceId,
              categoryId: parseInt(categoryId),
              lastScrapedAt: new Date(),
            },
          });
          count++;
        } catch (e) {
          console.error(`Error saving product "${p.title}":`, e);
        }
      }

      await prisma.scrapeJob.update({
        where: { id: scrapeJob.id },
        data: { status: 'SUCCESS', finishedAt: new Date() },
      });
      console.log(`Product scraping done. ${count} saved.`);
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
  {
    connection: {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    },
    limiter: { max: 1, duration: 2000 },
  },
);

worker.on('completed', (job) => console.log(`Job ${job.id} completed`));
worker.on('failed', (job, err) => console.error(`Job ${job?.id} failed:`, err));
worker.on('error', (err) => console.error('Worker error:', err));
console.log('Product worker listening...');
