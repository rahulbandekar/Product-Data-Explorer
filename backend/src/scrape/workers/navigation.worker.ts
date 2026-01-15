import 'dotenv/config';
import { Worker } from 'bullmq';
import { PlaywrightCrawler } from 'crawlee';
import { PrismaClient } from '@prisma/client';

const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours cache
const prisma = new PrismaClient();

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

console.log('🚀 Navigation worker starting...');

const worker = new Worker(
  'scrape-queue',
  async (job) => {
    // Only process navigation scrape jobs
    if (job.name !== 'scrape-navigation') {
      console.log(`⏭️ Skipping non-navigation job: ${job.name}`);
      return;
    }

    console.log(`🔍 Starting navigation scrape job: ${job.id}`);

    // Create job record in DB
    const scrapeJob = await prisma.scrapeJob.create({
      data: {
        targetUrl: 'https://www.worldofbooks.com/',
        targetType: 'navigation',
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    console.log(`📝 Created scrape job: ${scrapeJob.id}`);

    try {
      // ✅ BETTER CACHE CHECK: Check Navigation table instead of ScrapeJob
      const latestNavigation = await prisma.navigation.findFirst({
        where: {
          lastScrapedAt: {
            not: null,
          },
        },
        orderBy: { lastScrapedAt: 'desc' },
      });

      if (latestNavigation?.lastScrapedAt) {
        const timeSinceLastScrape = Date.now() - latestNavigation.lastScrapedAt.getTime();
        console.log(`⏰ Last navigation scrape was ${timeSinceLastScrape / 1000 / 60} minutes ago`);
        
        if (timeSinceLastScrape < CACHE_TTL_MS) {
          console.log('✅ Navigation data is fresh (cached within 24h). Skipping scrape.');
          
          await prisma.scrapeJob.update({
            where: { id: scrapeJob.id },
            data: {
              status: 'SKIPPED',
              finishedAt: new Date(),
            },
          });
          return;
        }
      }

      // Initialize crawler
      const crawler = new PlaywrightCrawler({
        maxRequestsPerCrawl: 1, // Only the homepage
        maxRequestsPerMinute: 8, // Respectful rate limiting
        requestHandlerTimeoutSecs: 30,
        
        launchContext: {
          launchOptions: {
            headless: true,
          },
        },

        async requestHandler({ page, request }) {
          console.log(`🌐 Scraping navigation from: ${request.url}`);
          
          await page.goto(request.url, { 
            waitUntil: 'networkidle',
            timeout: 30000 
          });

          // Wait for navigation to load
          await page.waitForSelector('nav, header, [role="navigation"]', { 
            timeout: 10000 
          }).catch(() => {
            console.log('ℹ️ Navigation selector not found, continuing with default scraping...');
          });

          // Scrape navigation items
          const navItems = await page.$$eval(
            'nav a, header a, [role="navigation"] a, .main-nav a, .navigation a, .header-nav a',
            (links) => 
              links
                .map((link) => {
                  const title = link.textContent?.trim();
                  const href = link.getAttribute('href');
                  
                  // Filter criteria from requirements
                  if (!title || 
                      !href || 
                      title.length < 2 || 
                      href === '#' ||
                      href.includes('javascript:') ||
                      href.includes('account') ||
                      href.includes('login') ||
                      href.includes('register') ||
                      href.includes('basket') ||
                      href.includes('cart') ||
                      title.toLowerCase().includes('sign')) {
                    return null;
                  }
                  
                  // Construct full URL
                  const fullUrl = href.startsWith('http') 
                    ? href 
                    : `https://www.worldofbooks.com${href.startsWith('/') ? href : '/' + href}`;
                  
                  return { 
                    title, 
                    href,
                    url: fullUrl
                  };
                })
                .filter((item): item is { title: string; href: string; url: string } => 
                  item !== null && item.title.length > 0
                )
                // Remove duplicates
                .filter((item, index, array) => 
                  index === array.findIndex(t => 
                    t.title.toLowerCase() === item.title.toLowerCase()
                  )
                )
          );

          console.log(`📊 Found ${navItems.length} navigation items`);

          // Store in database
          for (const item of navItems) {
            const slug = item.title
              .toLowerCase()
              .trim()
              .replace(/\s+/g, '-')
              .replace(/[^a-z0-9-]/g, '')
              .replace(/-+/g, '-');

            if (slug.length < 2) continue;

            await prisma.navigation.upsert({
              where: { slug },
              update: {
                title: item.title,
                lastScrapedAt: new Date(),
              },
              create: {
                title: item.title,
                slug,
                lastScrapedAt: new Date(),
              },
            });

            console.log(`✅ Upserted navigation: ${item.title}`);
          }
        },

        async failedRequestHandler({ request, error }) {
          console.error(`💥 Failed to scrape ${request.url}:`, error);
        },
      });

      // Run the crawler
      console.log(`▶️ Starting crawler...`);
      await crawler.run([{ url: 'https://www.worldofbooks.com/' }]);
      console.log(`🏁 Crawler finished`);

      // Update job as successful
      await prisma.scrapeJob.update({
        where: { id: scrapeJob.id },
        data: {
          status: 'SUCCESS',
          finishedAt: new Date(),
        },
      });

      console.log(`🎉 Navigation scraping completed successfully. Job ID: ${scrapeJob.id}`);

    } catch (error) {
      console.error('💀 Navigation scraping failed:', error);
      
      // Update job as failed
      await prisma.scrapeJob.update({
        where: { id: scrapeJob.id },
        data: {
          status: 'FAILED',
          errorLog: String(error).substring(0, 500),
          finishedAt: new Date(),
        },
      });
      
      throw error; // Let BullMQ handle retries
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    },
    limiter: {
      max: 1,
      duration: 1000, // 1 job per second max
    },
  }
);

worker.on('completed', (job) => {
  console.log(`✅ Navigation job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`💥 Navigation job ${job?.id} failed:`, err);
});

worker.on('error', (err) => {
  console.error('💀 Navigation worker error:', err);
});

console.log('👂 Navigation worker listening for jobs...');