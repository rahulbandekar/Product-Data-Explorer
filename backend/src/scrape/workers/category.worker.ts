import 'dotenv/config';
import { Worker } from 'bullmq';
import { PlaywrightCrawler } from 'crawlee';
import { PrismaClient } from '@prisma/client';

const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours cache
const prisma = new PrismaClient();

// Add global error handlers
process.on('uncaughtException', (error) => {
  console.error('💥 UNCAUGHT EXCEPTION:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

console.log('🚀 Category worker starting...');

const worker = new Worker(
  'scrape-queue',
  async (job) => {
    // Add at the beginning of the worker function:
    console.log('🔍 DEBUG: Entering worker function');
    console.log('  Job exists?', !!job);
    console.log('  Job name:', job?.name);

    if (!job) {
      console.log('⚠️ No job object!');
      return;
    }

    console.log(`📥 Processing job: ${job?.name} with ID: ${job?.id}`);

    // Only process category scrape jobs
    if (job.name !== 'scrape-categories') {
      console.log(`⏭️ Skipping non-category job: ${job.name}`);
      return;
    }

    const { navigationId, navigationSlug, navigationUrl } = job.data;

    console.log(`🔍 Starting category scrape for: ${navigationSlug}`);
    console.log(`📊 Data:`, { navigationId, navigationSlug, navigationUrl });

    if (!navigationId || !navigationSlug || !navigationUrl) {
      throw new Error(
        'Missing required job data: navigationId, navigationSlug, or navigationUrl',
      );
    }

    // Create job record in DB
    const scrapeJob = await prisma.scrapeJob.create({
      data: {
        targetUrl: navigationUrl,
        targetType: 'category',
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    console.log(`📝 Created scrape job: ${scrapeJob.id}`);

    try {
      // Add this at the beginning of try block in category.worker.ts
      console.log('🔍 Testing database connection...');
      try {
        await prisma.$connect();
        console.log('✅ Database connected');
        const navCount = await prisma.navigation.count();
        console.log(`✅ Navigation count: ${navCount}`);
      } catch (dbError) {
        console.error('❌ Database error:', dbError);
        throw dbError;
      }

      // Check cache - look for any category with this navigationId
      const latestCategory = await prisma.category.findFirst({
        where: {
          navigationId: parseInt(navigationId),
        },
        orderBy: { lastScrapedAt: 'desc' },
      });

      if (latestCategory?.lastScrapedAt) {
        const timeSinceLastScrape =
          Date.now() - latestCategory.lastScrapedAt.getTime();
        console.log(
          `⏰ Last category scrape was ${timeSinceLastScrape / 1000 / 60} minutes ago`,
        );

        if (timeSinceLastScrape < CACHE_TTL_MS) {
          console.log(
            `✅ Categories for ${navigationSlug} are fresh. Skipping scrape.`,
          );

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

      console.log(`🌐 Starting to scrape categories from: ${navigationUrl}`);

      // Initialize crawler with better configuration
      const crawler = new PlaywrightCrawler({
        maxRequestsPerCrawl: 15,
        maxRequestsPerMinute: 5, // Be very respectful
        requestHandlerTimeoutSecs: 60,
        navigationTimeoutSecs: 30000,

        launchContext: {
          launchOptions: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
          },
        },

        async requestHandler({ page, request }) {
          console.log(`🕸️ Loading page: ${request.url}`);

          try {
            await page.goto(request.url, {
              waitUntil: 'networkidle',
              timeout: 45000,
            });

            // Wait a bit for content to load
            await page.waitForTimeout(2000);

            // First, try to find categories with specific selectors
            const categorySelectors = [
              '.category-item',
              '.category-link',
              '.subcategory',
              '[data-category]',
              '.sidebar a',
              '.filters a',
              '.departments a',
              '.browse a',
            ];

            let categories: Array<{ title: string; href: string }> = [];

            for (const selector of categorySelectors) {
              try {
                const hasSelector = await page.$(selector).catch(() => null);
                if (hasSelector) {
                  console.log(`🔍 Found selector: ${selector}`);

                  const found = await page.$$eval(selector, (elements) =>
                    elements
                      .map((el) => {
                        const title = el.textContent?.trim();
                        const href = el.getAttribute('href');

                        if (!title || !href || title.length < 2) return null;

                        // Skip common non-category links
                        const skipKeywords = [
                          'account',
                          'login',
                          'register',
                          'basket',
                          'cart',
                          'wishlist',
                          'help',
                          'contact',
                        ];
                        const shouldSkip = skipKeywords.some(
                          (keyword) =>
                            title.toLowerCase().includes(keyword) ||
                            href.toLowerCase().includes(keyword),
                        );

                        if (shouldSkip) return null;

                        return { title, href };
                      })
                      .filter(
                        (item): item is { title: string; href: string } =>
                          item !== null,
                      ),
                  );

                  if (found.length > 0) {
                    categories = found;
                    console.log(
                      `✅ Found ${found.length} categories with selector: ${selector}`,
                    );
                    break;
                  }
                }
              } catch (err) {
                // Continue with next selector
                continue;
              }
            }

            // Fallback: look for any links that might be categories
            if (categories.length === 0) {
              console.log(
                '🔍 No specific category selectors found, trying general links...',
              );

              categories = await page.$$eval(
                'a',
                (links) =>
                  links
                    .map((link) => {
                      const title = link.textContent?.trim();
                      const href = link.getAttribute('href');

                      if (!title || !href || title.length < 3) return null;

                      // Look for category-like patterns
                      const url = href.toLowerCase();
                      const isCategoryLink =
                        url.includes('/category/') ||
                        url.includes('/categories/') ||
                        url.includes('/b/') ||
                        url.includes('/department/') ||
                        (url.includes('/en-us/') && url.split('/').length >= 4);

                      if (!isCategoryLink) return null;

                      return { title, href };
                    })
                    .filter(
                      (item): item is { title: string; href: string } =>
                        item !== null,
                    )
                    .slice(0, 50), // Limit to 50 categories
              );
            }

            console.log(`📊 Total categories found: ${categories.length}`);

            // Process categories
            const numId = parseInt(navigationId);
            let processedCount = 0;

            for (const category of categories) {
              try {
                const slug = category.title
                  .toLowerCase()
                  .trim()
                  .replace(/\s+/g, '-')
                  .replace(/[^a-z0-9-]/g, '')
                  .replace(/-+/g, '-');

                if (slug.length < 2) continue;

                // ✅ CORRECT: Use composite unique constraint [navigationId, slug]
                await prisma.category.upsert({
                  where: {
                    navigationId_slug: {
                      navigationId: numId,
                      slug: slug,
                    },
                  },
                  update: {
                    title: category.title,
                    lastScrapedAt: new Date(),
                  },
                  create: {
                    title: category.title,
                    slug: slug,
                    navigationId: numId,
                    lastScrapedAt: new Date(),
                  },
                });

                processedCount++;
                console.log(`✅ Added/Updated: ${category.title}`);
              } catch (error: any) {
                console.error(
                  `❌ Error processing category "${category.title}":`,
                  error.message,
                );
              }
            }

            console.log(
              `🎉 Successfully processed ${processedCount} categories`,
            );
          } catch (pageError) {
            console.error(`❌ Error loading/scraping page:`, pageError);
            throw pageError;
          }
        },

        async failedRequestHandler({ request, error }) {
          console.error(`💥 Failed to scrape ${request.url}:`, error);
        },
      });

      // Run the crawler
      console.log(`▶️ Starting crawler...`);
      await crawler.run([{ url: navigationUrl }]);
      console.log(`🏁 Crawler finished`);

      // Update job as successful
      await prisma.scrapeJob.update({
        where: { id: scrapeJob.id },
        data: {
          status: 'SUCCESS',
          finishedAt: new Date(),
        },
      });

      console.log(`✅ Category scraping completed for ${navigationSlug}`);
    } catch (error) {
      console.error(`💀 Category scraping failed:`, error);

      // Update job as failed
      await prisma.scrapeJob.update({
        where: { id: scrapeJob.id },
        data: {
          status: 'FAILED',
          errorLog: String(error).substring(0, 1000),
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
    limiter: {
      max: 1,
      duration: 3000,
    },
  },
);

worker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  console.error(`💥 Job ${job?.id} failed:`, err);
});

worker.on('error', (err) => {
  console.error('💀 Worker error:', err);
});

console.log('👂 Category worker listening for jobs...');
