// src/api/controllers/scrape.controller.ts
import { Controller, Post, Param, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiParam } from '@nestjs/swagger';
import { ScrapeQueueService } from '../../scrape/services/scrape-queue.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ScrapeRequestDto } from '../dto/scrape.dto';

@ApiTags('scrape')
@Controller('scrape')
export class ScrapeController {
  constructor(
    private readonly scrapeQueue: ScrapeQueueService,
    private readonly prisma: PrismaService // Add PrismaService
  ) {}

  @Post('navigation')
  @ApiOperation({ summary: 'Trigger navigation scraping' })
  @ApiBody({ type: ScrapeRequestDto })
  async scrapeNavigation(@Body() body: ScrapeRequestDto) {
    try {
      const job = await this.scrapeQueue.addNavigationScrapeJob({ 
        force: body.force 
      });
      return {
        success: true,
        message: 'Navigation scraping job queued',
        jobId: job.id,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to queue navigation scrape',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('categories/:navigationId')
  @ApiOperation({ summary: 'Trigger category scraping for navigation' })
  @ApiParam({ name: 'navigationId', description: 'Navigation ID', type: String })
  @ApiBody({ type: ScrapeRequestDto })
  async scrapeCategories(
    @Param('navigationId') navigationId: string,
    @Body() body: ScrapeRequestDto,
  ) {
    try {
      const id = parseInt(navigationId);
      if (isNaN(id)) {
        throw new HttpException('Invalid navigation ID', HttpStatus.BAD_REQUEST);
      }

      const job = await this.scrapeQueue.addCategoryScrapeJob(id, { 
        force: body.force 
      });
      return {
        success: true,
        message: 'Category scraping job queued',
        jobId: job.id,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to queue category scrape',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('products/:categoryId')
  @ApiOperation({ summary: 'Trigger product scraping for category' })
  @ApiParam({ name: 'categoryId', description: 'Category ID', type: String })
  @ApiBody({ type: ScrapeRequestDto })
  async scrapeProducts(
    @Param('categoryId') categoryId: string,
    @Body() body: ScrapeRequestDto,
  ) {
    try {
      const id = parseInt(categoryId);
      if (isNaN(id)) {
        throw new HttpException('Invalid category ID', HttpStatus.BAD_REQUEST);
      }

      const job = await this.scrapeQueue.addProductScrapeJob(id, { 
        force: body.force,
        url: body.url 
      });
      return {
        success: true,
        message: 'Product scraping job queued',
        jobId: job.id,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to queue product scrape',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('product-detail/:productId')
  @ApiOperation({ summary: 'Trigger product detail scraping' })
  @ApiParam({ name: 'productId', description: 'Product ID', type: String })
  @ApiBody({ type: ScrapeRequestDto })
  async scrapeProductDetail(
    @Param('productId') productId: string,
    @Body() body: ScrapeRequestDto,
  ) {
    try {
      const id = parseInt(productId);
      if (isNaN(id)) {
        throw new HttpException('Invalid product ID', HttpStatus.BAD_REQUEST);
      }

      // Get product to get URL
      const product = await this.prisma.product.findUnique({
        where: { id },
        select: { sourceUrl: true }
      });

      if (!product) {
        throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
      }

      // Add product-detail job to queue
      const job = await this.scrapeQueue.addProductDetailScrapeJob(id, {
        force: body.force,
        url: product.sourceUrl
      });
      
      return {
        success: true,
        message: 'Product detail scraping job queued',
        jobId: job.id,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to queue product detail scrape',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}