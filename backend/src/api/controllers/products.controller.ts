// src/api/controllers/products.controller.ts
import { Controller, Get, Post, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { ScrapeQueueService } from '../../scrape/services/scrape-queue.service';
import { PaginationDto } from '../dto/pagination.dto'; // Import from DTO file

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scrapeQueue: ScrapeQueueService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get products with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'categoryId', required: false, type: Number })
  async getProducts(
    @Query() pagination: PaginationDto,
    @Query('categoryId') categoryId?: string,
  ) {
    try {
      const { page = 1, limit = 20 } = pagination;
      const skip = (page - 1) * limit;

      const where = categoryId ? { categoryId: parseInt(categoryId) } : {};

      const [products, total] = await Promise.all([
        this.prisma.product.findMany({
          where,
          skip,
          take: limit,
          orderBy: { lastScrapedAt: 'desc' },
          include: {
            category: {
              select: { title: true, slug: true },
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
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch products',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product details by ID' })
  @ApiParam({ name: 'id', description: 'Product ID', type: String })
  async getProduct(@Param('id') id: string) {
    try {
      const productId = parseInt(id);
      if (isNaN(productId)) {
        throw new HttpException('Invalid product ID', HttpStatus.BAD_REQUEST);
      }

      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        include: {
          category: true,
          detail: true,
          reviews: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });

      if (!product) {
        throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
      }

      return {
        success: true,
        data: product,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch product',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/refresh')
  @ApiOperation({ summary: 'Refresh product details' })
  @ApiParam({ name: 'id', description: 'Product ID', type: String })
  async refreshProduct(@Param('id') id: string) {
    try {
      const productId = parseInt(id);
      if (isNaN(productId)) {
        throw new HttpException('Invalid product ID', HttpStatus.BAD_REQUEST);
      }

      // Get product URL
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        select: { sourceUrl: true }
      });

      if (!product) {
        throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
      }

      // Trigger scrape
      const job = await this.scrapeQueue.addProductDetailScrapeJob(productId, {
        force: true,
        url: product.sourceUrl
      });

      return {
        success: true,
        message: 'Product refresh job queued',
        jobId: job.id,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to refresh product',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}