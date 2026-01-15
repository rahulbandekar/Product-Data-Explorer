// src/scrape/services/scrape-queue.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ScrapeQueueService } from './scrape-queue.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Queue } from 'bullmq';

describe('ScrapeQueueService', () => {
  let service: ScrapeQueueService;
  let prismaService: jest.Mocked<PrismaService>;
  let queueMock: jest.Mocked<Queue>;

  beforeEach(async () => {
    queueMock = {
      add: jest.fn().mockResolvedValue({ id: 'test-job-id' }),
    } as any;

    prismaService = {
      navigation: {
        findUnique: jest.fn().mockResolvedValue({
          id: 1,
          title: 'Books',
          slug: 'books',
        }),
      },
      category: {
        findUnique: jest.fn().mockResolvedValue({
          id: 1,
          title: 'Fiction',
          slug: 'fiction',
          navigation: { slug: 'books' },
        }),
      },
      product: {
        findUnique: jest.fn().mockResolvedValue({
          id: 1,
          sourceUrl: 'http://example.com/product/1',
        }),
      },
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScrapeQueueService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
        {
          provide: Queue,
          useValue: queueMock,
        },
      ],
    }).compile();

    service = module.get<ScrapeQueueService>(ScrapeQueueService);
    // Inject the queue mock manually since it's created in constructor
    (service as any).queue = queueMock;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addNavigationScrapeJob', () => {
    it('should add navigation scrape job', async () => {
      const result = await service.addNavigationScrapeJob({ force: true });
      
      expect(queueMock.add).toHaveBeenCalledWith(
        'scrape-navigation',
        {
          type: 'navigation',
          force: true,
          timestamp: expect.any(String),
        },
        {
          jobId: expect.stringMatching(/^nav-\d+$/),
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
        },
      );
      
      expect(result).toEqual({ id: 'test-job-id' });
    });
  });

  describe('addCategoryScrapeJob', () => {
    it('should add category scrape job', async () => {
      const result = await service.addCategoryScrapeJob(1, { force: true });
      
      expect(prismaService.navigation.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      
      expect(queueMock.add).toHaveBeenCalledWith(
        'scrape-categories',
        {
          navigationId: '1',
          navigationSlug: 'books',
          navigationUrl: 'https://www.worldofbooks.com/en-us/books',
          force: true,
          timestamp: expect.any(String),
        },
        {
          jobId: expect.stringMatching(/^cat-1-\d+$/),
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
        },
      );
      
      expect(result).toEqual({ id: 'test-job-id' });
    });

    it('should throw error when navigation not found', async () => {
      (prismaService.navigation.findUnique as jest.Mock).mockResolvedValueOnce(null);
      
      await expect(service.addCategoryScrapeJob(999, { force: true }))
        .rejects.toThrow('Navigation 999 not found');
    });
  });

  describe('addProductDetailScrapeJob', () => {
    it('should add product detail scrape job', async () => {
      const result = await service.addProductDetailScrapeJob(1, { force: true });
      
      expect(prismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      
      expect(queueMock.add).toHaveBeenCalledWith(
        'scrape-product-detail',
        {
          productId: '1',
          productUrl: 'http://example.com/product/1',
          force: true,
          timestamp: expect.any(String),
        },
        {
          jobId: expect.stringMatching(/^detail-1-\d+$/),
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
        },
      );
      
      expect(result).toEqual({ id: 'test-job-id' });
    });
  });
});