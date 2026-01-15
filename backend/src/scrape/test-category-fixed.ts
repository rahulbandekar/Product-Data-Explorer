import 'dotenv/config';
import { Queue } from 'bullmq';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const queue = new Queue('scrape-queue');

async function simpleTest() {
  console.log('🎯 Starting category scrape test...\n');
  
  // 1. Check if we have navigation data
  const navCount = await prisma.navigation.count();
  console.log(`1. Navigation items in DB: ${navCount}`);
  
  if (navCount === 0) {
    console.log('❌ Please run navigation scraper first!');
    await prisma.$disconnect();
    return;
  }
  
  // 2. Get first navigation
  const nav = await prisma.navigation.findFirst();
  if (!nav) {
    console.log('❌ Unexpected error: No navigation found');
    await prisma.$disconnect();
    return;
  }
  
  console.log(`2. Using navigation: "${nav.title}" (ID: ${nav.id})\n`);
  
  // 3. Create safe job data
  const jobData = {
    navigationId: nav.id.toString(),
    navigationSlug: nav.slug || 'default-slug',
    navigationUrl: `https://www.worldofbooks.com/en-us/${nav.slug || 'books'}`,
  };
  
  console.log('3. Queueing category scrape job...');
  console.log('   Job data:', jobData);
  
  const job = await queue.add('scrape-categories', jobData, {
    jobId: `cat-${Date.now()}`,
  });
  
  console.log(`   ✅ Job added: ${job.id}`);
  console.log(`   ⏳ Check worker terminal for progress...\n`);
  
  // 4. Show current categories
  const currentCategories = await prisma.category.findMany({
    where: { navigationId: nav.id },
    take: 5,
  });
  
  console.log(`4. Current categories for "${nav.title}": ${currentCategories.length}`);
  currentCategories.forEach(cat => {
    console.log(`   • ${cat.title} (${cat.slug})`);
  });
  
  await prisma.$disconnect();
  console.log('\n🎉 Test completed! Check your category worker terminal.');
}

simpleTest().catch(console.error);