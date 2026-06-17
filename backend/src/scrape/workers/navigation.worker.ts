import 'dotenv/config';
import { Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

// HTTP-based scraper — replaces Playwright to work on free-tier servers.
// Playwright needs 300MB+ RAM and times out on Railway/Render free plans.

const CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const TARGET_URL = 'https://www.worldofbooks.com/en-us';
const prisma = new PrismaClient();

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
process.on('uncaughtException', (err) => console.error('Uncaught:', err));
process.on('unhandledRejection', (err) => console.error('Unhandled:', err));

console.log('Navigation worker starting (HTTP mode)...');

async function scrapeNavigationHttp(): Promise<
  Array<{ title: string; slug: string }>
> {
  const res = await axios.get(TARGET_URL, {
    timeout: 15000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; ProductExplorerBot/1.0)',
      Accept: 'text/html,application/xhtml+xml',
    },
  });

  const html: string = res.data;
  const items: Array<{ title: string; slug: string }> = [];
  const seen = new Set<string>();

  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]{2,60})<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1].trim();
    const rawTitle = match[2].replace(/\s+/g, ' ').trim();

    if (!href.includes('/en-us/') && !href.startsWith('/')) continue;
    const parts = href
      .replace(/^https?:\/\/[^/]+/, '')
      .split('/')
      .filter(Boolean);
    if (parts.length < 1 || parts.length > 2) continue;
    if (parts[0] === 'en-us' && parts.length < 2) continue;

    const slug = (parts[parts.length - 1] || '').toLowerCase();
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
      'signin',
      'signup',
      'faq',
      'sitemap',
      '',
    ];
    if (skipSlugs.includes(slug)) continue;
    if (!/[a-zA-Z]{3,}/.test(rawTitle)) continue;
    if (seen.has(slug)) continue;
    seen.add(slug);

    const cleanSlug = slug.replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');
    if (cleanSlug.length < 2) continue;

    items.push({ title: rawTitle, slug: cleanSlug });
    if (items.length >= 30) break;
  }

  // Seed fallback — guarantees the app always has data even if the site blocks bots
  if (items.length === 0) {
    console.log('No nav items found via HTTP — using seed fallback');
    return [
      { title: 'Books', slug: 'books' },
      { title: 'Fiction', slug: 'fiction' },
      { title: 'Non-Fiction', slug: 'non-fiction' },
      { title: "Children's Books", slug: 'childrens-books' },
      { title: 'Science & Nature', slug: 'science-nature' },
      { title: 'History', slug: 'history' },
      { title: 'Biography', slug: 'biography' },
      { title: 'Crime & Thriller', slug: 'crime-thriller' },
    ];
  }

  return items;
}

const worker = new Worker(
  'scrape-queue',
  async (job) => {
    if (job.name !== 'scrape-navigation') {
      console.log(`Skipping: ${job.name}`);
      return;
    }

    console.log(`Navigation scrape job: ${job.id}`);

    const scrapeJob = await prisma.scrapeJob.create({
      data: {
        targetUrl: TARGET_URL,
        targetType: 'navigation',
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    try {
      const latest = await prisma.navigation.findFirst({
        where: { lastScrapedAt: { not: null } },
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

      console.log(`Fetching ${TARGET_URL}...`);
      const navItems = await scrapeNavigationHttp();
      console.log(`Found ${navItems.length} navigation items`);

      for (const item of navItems) {
        await prisma.navigation.upsert({
          where: { slug: item.slug },
          update: { title: item.title, lastScrapedAt: new Date() },
          create: {
            title: item.title,
            slug: item.slug,
            lastScrapedAt: new Date(),
          },
        });
        console.log(`Upserted: ${item.title}`);
      }

      await prisma.scrapeJob.update({
        where: { id: scrapeJob.id },
        data: { status: 'SUCCESS', finishedAt: new Date() },
      });
      console.log('Navigation scraping done.');
    } catch (error) {
      console.error('Navigation scraping failed:', error);
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
console.log('Navigation worker listening...');
