import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Queue } from 'bullmq';

const prisma = new PrismaClient();
const queue = new Queue('scrape-queue');

@Injectable()
export class AppService {
  async getNavigation() {
    return prisma.navigation.findMany({
      orderBy: { title: 'asc' },
    });
  }

  async getCategories(slug: string) {
    const navigation = await prisma.navigation.findUnique({
      where: { slug },
      include: {
        categories: {
          orderBy: { title: 'asc' },
        },
      },
    });
    
    return navigation?.categories || [];
  }

  async scrapeCategories(navigationId: string) {
    const navigation = await prisma.navigation.findUnique({
      where: { id: parseInt(navigationId) },
    });

    if (!navigation) {
      throw new Error('Navigation not found');
    }

    const job = await queue.add('scrape-categories', {
      navigationId: navigation.id.toString(),
      navigationSlug: navigation.slug,
      navigationUrl: `https://www.worldofbooks.com/en-us/${navigation.slug}`,
    }, {
      jobId: `api-scrape-${Date.now()}`,
    });

    return {
      message: 'Category scrape job queued',
      jobId: job.id,
      navigation: navigation.title,
    };
  }
}