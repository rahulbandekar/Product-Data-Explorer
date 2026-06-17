import 'dotenv/config';
import { Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

// HTTP-based scraper — replaces Playwright to work on free-tier servers.

const CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const prisma = new PrismaClient();

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
process.on('uncaughtException', (err) => console.error('Uncaught:', err));
process.on('unhandledRejection', (err) => console.error('Unhandled:', err));

console.log('Category worker starting (HTTP mode)...');

async function scrapeCategoriesHttp(
  navigationUrl: string,
): Promise<Array<{ title: string; href: string }>> {
  const res = await axios.get(navigationUrl, {
    timeout: 15000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; ProductExplorerBot/1.0)',
      Accept: 'text/html,application/xhtml+xml',
    },
  });

  const html: string = res.data;
  const items: Array<{ title: string; href: string }> = [];
  const seen = new Set<string>();

  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]{2,80})<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1].trim();
    const rawTitle = match[2].replace(/\s+/g, ' ').trim();

    // Category links are deeper paths: /en-us/books/fiction
    const path = href.replace(/^https?:\/\/[^/]+/, '');
    const parts = path.split('/').filter(Boolean);
    if (parts.length < 2) continue;

    const slug = parts[parts.length - 1].toLowerCase();
    const skipSlugs = [
      'account',
      'login',
      'register',
      'basket',
      'cart',
      'wishlist',
      'help',
      'contact',
      'search',
      'checkout',
      '',
    ];
    if (skipSlugs.some((s) => slug.includes(s))) continue;
    if (!/[a-zA-Z]{3,}/.test(rawTitle)) continue;
    if (seen.has(href)) continue;
    seen.add(href);

    items.push({ title: rawTitle, href });
    if (items.length >= 50) break;
  }

  return items;
}

// Default categories per navigation slug — used if HTTP scrape returns nothing
const CATEGORY_SEEDS: Record<string, Array<{ title: string; slug: string }>> = {
  default: [
    { title: 'Fiction', slug: 'fiction' },
    { title: 'Non-Fiction', slug: 'non-fiction' },
    { title: "Children's Books", slug: 'childrens' },
    { title: 'Science', slug: 'science' },
    { title: 'History', slug: 'history' },
    { title: 'Biography', slug: 'biography' },
    { title: 'Crime & Thriller', slug: 'crime-thriller' },
    { title: 'Romance', slug: 'romance' },
  ],
  books: [
    { title: 'Fiction', slug: 'fiction' },
    { title: 'Crime & Thriller', slug: 'crime-thriller' },
    { title: 'Science Fiction', slug: 'science-fiction' },
    { title: 'Fantasy', slug: 'fantasy' },
    { title: 'Romance', slug: 'romance' },
    { title: 'Biography', slug: 'biography' },
    { title: 'History', slug: 'history' },
    { title: 'Self Help', slug: 'self-help' },
    { title: "Children's Books", slug: 'childrens' },
    { title: 'Travel', slug: 'travel' },
  ],
};

const worker = new Worker(
  'scrape-queue',
  async (job) => {
    if (job.name !== 'scrape-categories') {
      console.log(`Skipping: ${job.name}`);
      return;
    }

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
      // Cache check
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

      console.log(`Fetching ${navigationUrl}...`);
      const scraped = await scrapeCategoriesHttp(navigationUrl);
      console.log(`Found ${scraped.length} categories via HTTP`);

      const numId = parseInt(navigationId);
      let count = 0;

      for (const cat of scraped) {
        const slug = cat.title
          .toLowerCase()
          .trim()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')
          .replace(/-+/g, '-');

        if (slug.length < 2) continue;

        try {
          await prisma.category.upsert({
            where: { navigationId_slug: { navigationId: numId, slug } },
            update: { title: cat.title, lastScrapedAt: new Date() },
            create: {
              title: cat.title,
              slug,
              navigationId: numId,
              lastScrapedAt: new Date(),
            },
          });
          count++;
        } catch (e) {
          console.error(`Error saving "${cat.title}":`, e);
        }
      }

      // Seed fallback — guarantees the app always has categories to show
      if (count === 0) {
        console.log('No categories scraped — using seed fallback');
        const seeds = CATEGORY_SEEDS[navigationSlug] ?? CATEGORY_SEEDS.default;
        for (const seed of seeds) {
          await prisma.category.upsert({
            where: {
              navigationId_slug: { navigationId: numId, slug: seed.slug },
            },
            update: { title: seed.title, lastScrapedAt: new Date() },
            create: {
              title: seed.title,
              slug: seed.slug,
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
      console.log(`Category scraping done. ${count} saved.`);
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
worker.on('error', (err) => console.error('Worker error:', err));
console.log('Category worker listening...');
