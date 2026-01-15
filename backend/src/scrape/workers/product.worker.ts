// src/scrape/workers/product.worker.ts - Fixed version
import 'dotenv/config';
import { Worker } from 'bullmq';
import { PlaywrightCrawler } from 'crawlee';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const worker = new Worker(
  'scrape-queue',
  async (job) => {
    if (job.name !== 'scrape-products') return;

    const { categoryId, categoryUrl, force = false } = job.data;
    
    console.log(`📦 Starting product scrape for category ${categoryId}: ${categoryUrl}`);

    const scrapeJob = await prisma.scrapeJob.create({
      data: {
        targetUrl: categoryUrl,
        targetType: 'products',
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });

    try {
      // Cache check (24 hours)
      if (!force) {
        const latestProduct = await prisma.product.findFirst({
          where: { categoryId: parseInt(categoryId) },
          orderBy: { lastScrapedAt: 'desc' },
        });

        if (latestProduct?.lastScrapedAt) {
          const timeSince = Date.now() - latestProduct.lastScrapedAt.getTime();
          if (timeSince < 24 * 60 * 60 * 1000) {
            console.log('✅ Products are fresh, skipping scrape');
            await prisma.scrapeJob.update({
              where: { id: scrapeJob.id },
              data: { status: 'SKIPPED', finishedAt: new Date() },
            });
            return;
          }
        }
      }

      const crawler = new PlaywrightCrawler({
        maxRequestsPerCrawl: 50,
        maxRequestsPerMinute: 10,
        
        async requestHandler({ page, request }) {
          console.log(`🛒 Scraping products from: ${request.url}`);
          await page.goto(request.url, { waitUntil: 'networkidle' });

          // Extract products with null checks
          const products = await page.$$eval('.product-item, .product-card, [data-product]', (items) => 
            items.map(item => {
              const title = item.querySelector('.title, h3, [data-title]')?.textContent?.trim();
              const author = item.querySelector('.author, .brand, [data-author]')?.textContent?.trim();
              const priceText = item.querySelector('.price, [data-price]')?.textContent?.trim();
              const image = item.querySelector('img')?.src;
              const link = item.querySelector('a')?.href;
              
              if (!title || !priceText || !link) return null;
              
              // Parse price
              const priceMatch = priceText.match(/[\d.,]+/);
              const price = priceMatch ? parseFloat(priceMatch[0].replace(',', '.')) : 0;
              
              // Extract source ID from URL
              const sourceIdMatch = link.match(/\/(\d+)\/?$/);
              const sourceId = sourceIdMatch ? sourceIdMatch[1] : null;
              
              return {
                title,
                author: author || null,
                price,
                imageUrl: image || '',
                sourceUrl: link,
                sourceId,
              };
            }).filter((item): item is NonNullable<typeof item> => item !== null)
          );

          console.log(`📊 Found ${products.length} products`);

          // Save to database
          for (const product of products) {
            if (!product.sourceId) continue;
            
            await prisma.product.upsert({
              where: { sourceId: product.sourceId },
              update: {
                title: product.title,
                price: product.price,
                currency: 'GBP',
                imageUrl: product.imageUrl,
                categoryId: parseInt(categoryId),
                lastScrapedAt: new Date(),
              },
              create: {
                title: product.title,
                author: product.author,
                price: product.price,
                currency: 'GBP',
                imageUrl: product.imageUrl,
                sourceUrl: product.sourceUrl,
                sourceId: product.sourceId,
                categoryId: parseInt(categoryId),
                lastScrapedAt: new Date(),
              },
            });
          }
        },
      });

      await crawler.run([{ url: categoryUrl }]);
      
      await prisma.scrapeJob.update({
        where: { id: scrapeJob.id },
        data: { status: 'SUCCESS', finishedAt: new Date() },
      });
      
      console.log(`✅ Product scraping completed for category ${categoryId}`);
      
    } catch (error) {
      console.error('💀 Product scraping failed:', error);
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
  }
);

console.log('📦 Product worker started');