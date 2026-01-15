import { Queue } from 'bullmq';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const queue = new Queue('scrape-queue');

async function test() {
  console.log('🎯 Quick test...');
  
  const nav = await prisma.navigation.findFirst();
  if (!nav) {
    console.log('❌ No navigation');
    return;
  }
  
  console.log(`📚 Using: ${nav.title}`);
  
  const job = await queue.add('scrape-categories', {
    navigationId: nav.id.toString(),
    navigationSlug: nav.slug || 'books',
    navigationUrl: 'https://www.worldofbooks.com/en-us/books',
  }, {
    jobId: `quick-${Date.now()}`
  });
  
  console.log(`✅ Job queued: ${job.id}`);
  
  // Wait and check
  setTimeout(async () => {
    const state = await job.getState();
    console.log(`📋 Job state: ${state}`);
    
    const categories = await prisma.category.findMany({
      where: { navigationId: nav.id }
    });
    
    console.log(`📊 Categories created: ${categories.length}`);
    
    await prisma.$disconnect();
    process.exit(0);
  }, 10000);
}

test().catch(console.error);
