import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { ScrapeQueueService } from './scrape/services/scrape-queue.service';

@Injectable()
export class AppService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scrapeQueue: ScrapeQueueService,
  ) {}

  async getNavigation() {
    return this.prisma.navigation.findMany({
      orderBy: { title: 'asc' },
    });
  }

  async getCategories(slug: string) {
    const navigation = await this.prisma.navigation.findUnique({
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
    const navigation = await this.prisma.navigation.findUnique({
      where: { id: parseInt(navigationId) },
    });

    if (!navigation) {
      throw new Error('Navigation not found');
    }

    const job = await this.scrapeQueue.addCategoryScrapeJob(navigation.id, {
      force: false,
    });

    return {
      message: 'Category scrape job queued',
      jobId: job.id,
      navigation: navigation.title,
    };
  }
}