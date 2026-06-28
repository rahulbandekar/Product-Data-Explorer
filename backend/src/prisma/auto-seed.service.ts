import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class AutoSeedService implements OnModuleInit {
  private readonly logger = new Logger('AutoSeed');

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      const count = await this.prisma.navigation.count();
      if (count > 0) {
        this.logger.log(
          `DB already has ${count} navigation rows — skipping auto-seed.`,
        );
        return;
      }
      this.logger.log('Database is empty — running first-time seed...');
      await this.seed();
      this.logger.log('✅ Auto-seed complete.');
    } catch (err) {
      this.logger.error('Auto-seed failed', err as Error);
    }
  }

  async seed() {
    const navigation = await this.prisma.navigation.upsert({
      where: { slug: 'books' },
      update: {},
      create: { title: 'Books', slug: 'books', lastScrapedAt: null },
    });

    const categories = await Promise.all([
      this.prisma.category.upsert({
        where: {
          navigationId_slug: { navigationId: navigation.id, slug: 'fiction' },
        },
        update: {},
        create: {
          title: 'Fiction',
          slug: 'fiction',
          navigationId: navigation.id,
          productCount: 0,
          lastScrapedAt: new Date(),
        },
      }),
      this.prisma.category.upsert({
        where: {
          navigationId_slug: {
            navigationId: navigation.id,
            slug: 'non-fiction',
          },
        },
        update: {},
        create: {
          title: 'Non-Fiction',
          slug: 'non-fiction',
          navigationId: navigation.id,
          productCount: 0,
          lastScrapedAt: new Date(),
        },
      }),
      this.prisma.category.upsert({
        where: {
          navigationId_slug: {
            navigationId: navigation.id,
            slug: 'childrens',
          },
        },
        update: {},
        create: {
          title: "Children's Books",
          slug: 'childrens',
          navigationId: navigation.id,
          productCount: 0,
          lastScrapedAt: new Date(),
        },
      }),
    ]);

    const products = await Promise.all([
      this.prisma.product.upsert({
        where: { sourceId: 'test-001' },
        update: {},
        create: {
          title: 'The Great Gatsby',
          author: 'F. Scott Fitzgerald',
          price: 12.99,
          currency: 'GBP',
          imageUrl: 'https://images.example.com/gatsby.jpg',
          sourceUrl:
            'https://www.worldofbooks.com/en-us/books/the-great-gatsby',
          sourceId: 'test-001',
          categoryId: categories[0].id,
          lastScrapedAt: new Date(),
        },
      }),
      this.prisma.product.upsert({
        where: { sourceId: 'test-002' },
        update: {},
        create: {
          title: 'A Brief History of Time',
          author: 'Stephen Hawking',
          price: 15.99,
          currency: 'GBP',
          imageUrl: 'https://images.example.com/history-time.jpg',
          sourceUrl:
            'https://www.worldofbooks.com/en-us/books/a-brief-history-of-time',
          sourceId: 'test-002',
          categoryId: categories[1].id,
          lastScrapedAt: new Date(),
        },
      }),
      this.prisma.product.upsert({
        where: { sourceId: 'test-003' },
        update: {},
        create: {
          title: "Harry Potter and the Philosopher's Stone",
          author: 'J.K. Rowling',
          price: 9.99,
          currency: 'GBP',
          imageUrl: 'https://images.example.com/harry-potter.jpg',
          sourceUrl: 'https://www.worldofbooks.com/en-us/books/harry-potter',
          sourceId: 'test-003',
          categoryId: categories[2].id,
          lastScrapedAt: new Date(),
        },
      }),
    ]);

    await this.prisma.productDetail.upsert({
      where: { productId: products[0].id },
      update: {},
      create: {
        productId: products[0].id,
        description: 'A classic novel of the Jazz Age...',
        specs: {
          publisher: 'Scribner',
          publicationDate: '1925',
          isbn: '9780743273565',
          pages: 180,
          format: 'Paperback',
        },
        ratingsAvg: 4.5,
        reviewsCount: 3,
      },
    });

    await Promise.all([
      this.prisma.review.create({
        data: {
          author: 'John Doe',
          rating: 5,
          text: 'Amazing book! Could not put it down.',
          productId: products[0].id,
        },
      }),
      this.prisma.review.create({
        data: {
          author: 'Jane Smith',
          rating: 4,
          text: 'Great read, but the ending was predictable.',
          productId: products[0].id,
        },
      }),
    ]);

    return {
      navigation: navigation.title,
      categories: categories.length,
      products: products.length,
    };
  }
}
