import { Queue } from 'bullmq';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const queue = new Queue('scrape-queue', {
  connection: { host: '127.0.0.1', port: 6379 }
});

async function testQueue() {
  console.log('🔄 Testing queue...');
  
  // Add a simple test job
  const job = await queue.add('scrape-categories', {
    navigationId: '5',
    navigationSlug: 'fantasy',
    navigationUrl: 'https://www.worldofbooks.com/en-us/fantasy'
  }, {
    jobId: `test-${Date.now()}`
  });
  
  console.log('✅ Job added:', job.id);
  console.log('📊 Job name:', job.name);
  
  // Check queue stats
  const waitCount = await queue.getWaitingCount();
  const activeCount = await queue.getActiveCount();
  
  console.log(`📈 Queue stats: ${waitCount} waiting, ${activeCount} active`);
  
  await prisma.$disconnect();
  
  // Keep process alive for a bit
  setTimeout(() => {
    console.log('🏁 Test complete');
    process.exit(0);
  }, 5000);
}

testQueue().catch(console.error);
