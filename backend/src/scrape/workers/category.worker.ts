import 'dotenv/config';
import { Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { WORLD_OF_BOOKS_TAXONOMY } from '../data/world-of-books-taxonomy';

const CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const prisma = new PrismaClient();

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
process.on('uncaughtException', (err) => console.error('Uncaught:', err));
process.on('unhandledRejection', (err) => console.error('Unhandled:', err));

console.log('Category worker starting...');

async function scrapeCategoriesHttp(navigationUrl: string) {
  const res = await axios.get(navigationUrl, {
    timeout: 15000,
    maxRedirects: 5,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });

  const html: string = res.data;
  const items: Array<{ title: string; href: string }> = [];
  const seen = new Set<string>();

  // Real World of Books category pages live at /collections/<handle> —
  // matching on that path is far more reliable than a generic depth heuristic.
  const linkRegex =
    /<a[^>]+href=["']([^"']*\/collections\/[^"'?#]+)["'][^>]*>([^<]{2,80})<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1].trim();
    const title = match[2].replace(/\s+/g, ' ').trim();
    if (!title || seen.has(href)) continue;
    if (/^(all|view all)$/i.test(title)) continue;
    seen.add(href);
    items.push({
      title,
      href: href.startsWith('http')
        ? href
        : `https://www.worldofbooks.com${href}`,
    });
    if (items.length >= 40) break;
  }

  return items;
}

const worker = new Worker(
  'scrape-queue',
  async (job) => {
    if (job.name !== 'scrape-categories') return;

    const { navigationId, navigationSlug, navigationUrl } = job.data;
    if (!navigationId || !navigationSlug || !navigationUrl) {
      throw new Error(
        'Missing required job data: navigationId, navigationSlug, navigationUrl',
      );
    }

    console.log(`Category scrape for: ${navigationSlug}`);
    const scrapeJob = await prisma.scrapeJob.create({
      data: {
        targetUrl: navigationUrl,
        targetType: 'category',
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    try {
      const latest = await prisma.category.findFirst({
        where: { navigationId: parseInt(navigationId) },
        orderBy: { lastScrapedAt: 'desc' },
      });

      if (latest?.lastScrapedAt && !job.data.force) {
        const age = Date.now() - latest.lastScrapedAt.getTime();
        if (age < CACHE_TTL_MS) {
          console.log(
            `Cache fresh (${Math.round(age / 60000)}m old). Skipping.`,
          );
          await prisma.scrapeJob.update({
            where: { id: scrapeJob.id },
            data: { status: 'SKIPPED', finishedAt: new Date() },
          });
          return;
        }
      }

      const numId = parseInt(navigationId);
      let count = 0;

      try {
        console.log(`Fetching ${navigationUrl}...`);
        const scraped = await scrapeCategoriesHttp(navigationUrl);
        console.log(`Found ${scraped.length} category links via HTTP`);

        for (const cat of scraped) {
          const slugMatch = cat.href.match(/\/collections\/([^/?#]+)/);
          const slug = slugMatch?.[1];
          if (!slug) continue;

          await prisma.category.upsert({
            where: { navigationId_slug: { navigationId: numId, slug } },
            update: {
              title: cat.title,
              sourceUrl: cat.href,
              lastScrapedAt: new Date(),
            },
            create: {
              title: cat.title,
              slug,
              sourceUrl: cat.href,
              navigationId: numId,
              lastScrapedAt: new Date(),
            },
          });
          count++;
        }
      } catch (e) {
        console.warn(
          `Live category scrape failed for ${navigationSlug}, using verified taxonomy:`,
          (e as Error).message,
        );
      }

      // Safety net — ensures the curated, verified categories are always present
      // even if the live scrape above failed or the site structure shifted.
      const taxonomyNav = WORLD_OF_BOOKS_TAXONOMY.find(
        (n) => n.slug === navigationSlug,
      );
      if (taxonomyNav) {
        for (const cat of taxonomyNav.categories) {
          await prisma.category.upsert({
            where: {
              navigationId_slug: { navigationId: numId, slug: cat.slug },
            },
            update: {
              title: cat.title,
              sourceUrl: cat.sourceUrl,
              lastScrapedAt: new Date(),
            },
            create: {
              title: cat.title,
              slug: cat.slug,
              sourceUrl: cat.sourceUrl,
              navigationId: numId,
              lastScrapedAt: new Date(),
            },
          });
          count++;
        }
      }

      await prisma.scrapeJob.update({
        where: { id: scrapeJob.id },
        data: { status: 'SUCCESS', finishedAt: new Date() },
      });
      console.log(`Category scraping done. ${count} upserted.`);
    } catch (error) {
      console.error('Category scraping failed:', error);
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
console.log('Category worker listening...');
