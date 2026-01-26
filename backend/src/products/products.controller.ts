import { Controller, Get, Post, Param, Query, ParseIntPipe } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getProducts(
    @Query('categoryId', ParseIntPipe) categoryId?: number,
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 12,
  ) {
    const skip = (page - 1) * limit;
    
    const where = categoryId ? { categoryId } : {};
    
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { lastScrapedAt: 'desc' },
        include: {
          category: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          detail: true,
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  @Get(':id')
  async getProduct(@Param('id', ParseIntPipe) id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
        detail: true,
      },
    });

    if (!product) {
      return {
        success: false,
        error: 'Product not found',
      };
    }

    return {
      success: true,
      data: product,
    };
  }

  @Get(':id/reviews')
  async getProductReviews(@Param('id', ParseIntPipe) id: number) {
    const reviews = await this.prisma.review.findMany({
      where: { productId: id },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: reviews,
    };
  }

  @Post(':id/refresh')
  async refreshProduct(@Param('id', ParseIntPipe) id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return {
        success: false,
        error: 'Product not found',
      };
    }

    // Add to scrape queue
    // You'll need to implement this based on your scrape queue service
    return {
      success: true,
      message: 'Product refresh queued',
      jobId: `refresh-${id}-${Date.now()}`,
    };
  }
}