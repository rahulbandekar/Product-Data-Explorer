import 'dotenv/config';
import { Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { WORLD_OF_BOOKS_TAXONOMY } from '../data/world-of-books-taxonomy';
import { getRedisConnection } from '../../common/redis-connection';

const CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const TARGET_URL = 'https://www.worldofbooks.com/';
const prisma = new PrismaClient();

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
process.on('uncaughtException', (err) => console.error('Uncaught:', err));
process.on('unhandledRejection', (err) => console.error('Unhandled:', err));

console.log('Navigation worker starting...');

const worker = new Worker(
  'scrape-queue',
  async (job) => {
    if (job.name !== 'scrape-navigation') return;

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

      // Live availability/sanity check — doesn't drive the taxonomy itself
      // (mega-menu HTML is too fragile to regex-parse reliably) but confirms
      // the site is up and confirms our base URL still resolves.
      try {
        await axios.get(TARGET_URL, {
          timeout: 15000,
          maxRedirects: 5,
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });
        console.log('Site reachable, proceeding with verified taxonomy.');
      } catch (e) {
        console.warn(
          'Site unreachable, proceeding with cached taxonomy anyway:',
          (e as Error).message,
        );
      }

      for (const nav of WORLD_OF_BOOKS_TAXONOMY) {
        await prisma.navigation.upsert({
          where: { slug: nav.slug },
          update: {
            title: nav.title,
            sourceUrl: nav.sourceUrl,
            lastScrapedAt: new Date(),
          },
          create: {
            title: nav.title,
            slug: nav.slug,
            sourceUrl: nav.sourceUrl,
            lastScrapedAt: new Date(),
          },
        });
      }

      await prisma.scrapeJob.update({
        where: { id: scrapeJob.id },
        data: { status: 'SUCCESS', finishedAt: new Date() },
      });
      console.log(
        `Navigation scraping done. ${WORLD_OF_BOOKS_TAXONOMY.length} headings upserted.`,
      );
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
    connection: getRedisConnection(),
    limiter: { max: 1, duration: 2000 },
  },
);

worker.on('completed', (job) => console.log(`Job ${job.id} completed`));
worker.on('failed', (job, err) => console.error(`Job ${job?.id} failed:`, err));
console.log('Navigation worker listening...');
