// src/scrape/workers/product-detail.worker.ts
import 'dotenv/config';
import { Worker } from 'bullmq';
import { PlaywrightCrawler } from 'crawlee';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const worker = new Worker(
  'scrape-queue',
  async (job) => {
    if (job.name !== 'scrape-product-detail') return;

    const { productId, productUrl, force = false } = job.data;
    
    console.log(`📖 Starting product detail scrape for product ${productId}: ${productUrl}`);

    const scrapeJob = await prisma.scrapeJob.create({
      data: {
        targetUrl: productUrl,
        targetType: 'product-detail',
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    try {
      // Check if we already have fresh details
      if (!force) {
        const product = await prisma.product.findUnique({
          where: { id: parseInt(productId) },
          include: { detail: true },
        });

        if (product?.detail?.updatedAt) {
          const timeSince = Date.now() - product.detail.updatedAt.getTime();
          if (timeSince < 24 * 60 * 60 * 1000) {
            console.log('✅ Product details are fresh, skipping scrape');
            await prisma.scrapeJob.update({
              where: { id: scrapeJob.id },
              data: { status: 'SKIPPED', finishedAt: new Date() },
            });
            return;
          }
        }
      }

      const crawler = new PlaywrightCrawler({
        maxRequestsPerCrawl: 1,
        maxRequestsPerMinute: 5,
        
        async requestHandler({ page, request }) {
          console.log(`📄 Scraping product details from: ${request.url}`);
          await page.goto(request.url, { waitUntil: 'networkidle' });

          // Extract product details
          const description = await page.$eval(
            '.description, .product-description, [data-description]',
            el => el.textContent?.trim()
          ).catch(() => null);

          // Extract reviews if available
          const reviews = await page.$$eval(
            '.review, .customer-review, [data-review]',
            (reviewElements) =>
              reviewElements.map(review => {
                const author = review.querySelector('.author, .reviewer')?.textContent?.trim();
                const rating = review.querySelector('.rating, .stars')?.textContent?.trim();
                const text = review.querySelector('.text, .review-text')?.textContent?.trim();
                const date = review.querySelector('.date, .review-date')?.textContent?.trim();

                return {
                  author: author || 'Anonymous',
                  rating: rating ? parseFloat(rating.match(/[\d.]+/)?.[0] || '0') : 0,
                  text: text || '',
                  date: date || new Date().toISOString().split('T')[0],
                };
              })
          ).catch(() => []);

          // Extract additional metadata
          const metadata = {
            publisher: await page.$eval('[data-publisher], .publisher', el => el.textContent?.trim()).catch(() => null),
            publicationDate: await page.$eval('[data-publication-date], .pub-date', el => el.textContent?.trim()).catch(() => null),
            isbn: await page.$eval('[data-isbn], .isbn', el => el.textContent?.trim()).catch(() => null),
            format: await page.$eval('[data-format], .format', el => el.textContent?.trim()).catch(() => null),
          };

          // Calculate average rating
          const ratings = reviews.map(r => r.rating).filter(r => r > 0);
          const ratingsAvg = ratings.length > 0 
            ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
            : null;

          // Save product detail
          await prisma.productDetail.upsert({
            where: { productId: parseInt(productId) },
            update: {
              description: description || '',
              specs: metadata,
              ratingsAvg,
              reviewsCount: reviews.length,
            },
            create: {
              productId: parseInt(productId),
              description: description || '',
              specs: metadata,
              ratingsAvg,
              reviewsCount: reviews.length,
            },
          });

          // Save reviews
          for (const review of reviews) {
            await prisma.review.create({
              data: {
                author: review.author,
                rating: review.rating,
                text: review.text,
                productId: parseInt(productId),
                createdAt: new Date(review.date),
              },
            });
          }

          console.log(`✅ Saved details for product ${productId}: ${reviews.length} reviews`);
        },
      });

      await crawler.run([{ url: productUrl }]);
      
      await prisma.scrapeJob.update({
        where: { id: scrapeJob.id },
        data: { status: 'SUCCESS', finishedAt: new Date() },
      });
      
      console.log(`✅ Product detail scraping completed for product ${productId}`);
      
    } catch (error) {
      console.error('💀 Product detail scraping failed:', error);
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
  }
);

console.log('📖 Product detail worker started');