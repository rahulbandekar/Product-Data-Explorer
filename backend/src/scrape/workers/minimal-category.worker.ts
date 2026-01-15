// backend/src/scrape/workers/minimal-category.worker.ts
import 'dotenv/config';
import { Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('🎯 MINIMAL WORKER: Starting...');

const worker = new Worker(
  'scrape-queue',
  async (job) => {
    console.log('🎯 MINIMAL WORKER: Job received!');
    console.log('  Job ID:', job.id);
    console.log('  Job name:', job.name);
    console.log('  Job data:', job.data);
    
    if (job.name === 'scrape-categories') {
      console.log('🎯 Processing category job...');
      
      try {
        // Simple test - create a category
        await prisma.category.create({
          data: {
            title: 'Test from Minimal Worker',
            slug: 'test-minimal-worker',
            navigationId: parseInt(job.data.navigationId),
            lastScrapedAt: new Date(),
          },
        });
        
        console.log('✅ Test category created!');
        return { success: true };
        
      } catch (error) {
        console.error('❌ Error creating category:', error);
        throw error;
      }
    }
    
    return { processed: true };
  },
  {
    connection: {
      host: '127.0.0.1',
      port: 6379,
    },
    concurrency: 1,
  }
);

worker.on('completed', (job) => {
  console.log(`✅ MINIMAL WORKER: Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ MINIMAL WORKER: Job ${job?.id} failed:`, err);
});

worker.on('error', (err) => {
  console.error('💥 MINIMAL WORKER Error:', err);
});

console.log('🎯 MINIMAL WORKER: Listening on "scrape-queue"');