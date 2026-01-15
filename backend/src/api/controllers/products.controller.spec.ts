// src/api/controllers/products.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { ScrapeQueueService } from '../../scrape/services/scrape-queue.service';

const mockProduct = {
  id: 1,
  title: 'Test Product',
  price: 29.99,
  author: 'Test Author',
  imageUrl: 'http://example.com/image.jpg',
  sourceUrl: 'http://example.com/product/1',
  sourceId: '12345',
  categoryId: 1,
  lastScrapedAt: new Date(),
  category: {
    title: 'Test Category',
    slug: 'test-category',
  },
  detail: {
    description: 'Test description',
    ratingsAvg: 4.5,
    reviewsCount: 10,
  },
  reviews: [],
};

describe('ProductsController', () => {
  let controller: ProductsController;
  let prismaService: PrismaService;
  let scrapeQueueService: ScrapeQueueService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            product: {
              findMany: jest.fn().mockResolvedValue([mockProduct]),
              count: jest.fn().mockResolvedValue(1),
              findUnique: jest.fn().mockResolvedValue(mockProduct),
            },
          },
        },
        {
          provide: ScrapeQueueService,
          useValue: {
            addProductDetailScrapeJob: jest.fn().mockResolvedValue({ id: 'refresh-job-id' }),
          },
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    prismaService = module.get(PrismaService);
    scrapeQueueService = module.get(ScrapeQueueService);
  });

  describe('getProducts', () => {
    it('should return paginated products', async () => {
      const result = await controller.getProducts({ page: 1, limit: 20 });
      
      expect(prismaService.product.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 20,
        orderBy: { lastScrapedAt: 'desc' },
        include: {
          category: { select: { title: true, slug: true } },
          detail: true,
        },
      });
      
      expect(result).toEqual({
        success: true,
        data: [mockProduct],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          pages: 1,
        },
      });
    });

    it('should filter by categoryId when provided', async () => {
      await controller.getProducts({ page: 1, limit: 20 }, '1');
      
      expect(prismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { categoryId: 1 },
        }),
      );
    });
  });

  describe('getProduct', () => {
    it('should return product by ID', async () => {
      const result = await controller.getProduct('1');
      
      expect(prismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          category: true,
          detail: true,
          reviews: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });
      
      expect(result).toEqual({
        success: true,
        data: mockProduct,
      });
    });

    it('should throw error for invalid product ID', async () => {
      await expect(controller.getProduct('invalid')).rejects.toThrow('Invalid product ID');
    });

    it('should throw error when product not found', async () => {
      // Mock a different return for this specific test
      (prismaService.product.findUnique as jest.Mock).mockResolvedValueOnce(null);
      
      await expect(controller.getProduct('999')).rejects.toThrow('Product not found');
    });
  });

  describe('refreshProduct', () => {
    it('should trigger product refresh', async () => {
      // Mock findUnique to return a product with sourceUrl
      (prismaService.product.findUnique as jest.Mock).mockResolvedValueOnce({
        sourceUrl: 'http://example.com/product/1',
      });
      
      const result = await controller.refreshProduct('1');
      
      expect(scrapeQueueService.addProductDetailScrapeJob).toHaveBeenCalledWith(1, {
        force: true,
        url: 'http://example.com/product/1',
      });
      
      expect(result).toEqual({
        success: true,
        message: 'Product refresh job queued',
        jobId: 'refresh-job-id',
      });
    });
  });
});