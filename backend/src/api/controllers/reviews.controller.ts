// src/api/controllers/reviews.controller.ts
import { Controller, Get, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('by-product/:productId')
  @ApiOperation({ summary: 'Get reviews by product ID' })
  @ApiParam({ name: 'productId', description: 'Product ID', type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getReviewsByProduct(
    @Param('productId') productId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    try {
      const productIdNum = parseInt(productId);
      if (isNaN(productIdNum)) {
        throw new HttpException('Invalid product ID', HttpStatus.BAD_REQUEST);
      }

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      const [reviews, total] = await Promise.all([
        this.prisma.review.findMany({
          where: { productId: productIdNum },
          skip,
          take: limitNum,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.review.count({
          where: { productId: productIdNum },
        }),
      ]);

      return {
        success: true,
        data: reviews,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch reviews',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stats/:productId')
  @ApiOperation({ summary: 'Get review statistics for a product' })
  @ApiParam({ name: 'productId', description: 'Product ID', type: String })
  async getReviewStats(@Param('productId') productId: string) {
    try {
      const productIdNum = parseInt(productId);
      if (isNaN(productIdNum)) {
        throw new HttpException('Invalid product ID', HttpStatus.BAD_REQUEST);
      }

      const reviews = await this.prisma.review.findMany({
        where: { productId: productIdNum, rating: { not: null } },
        select: { rating: true },
      });

      const ratings = reviews.map(r => r.rating).filter(r => r !== null) as number[];
      
      const stats = {
        total: reviews.length,
        average: ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0,
        distribution: {
          1: ratings.filter(r => r >= 1 && r < 2).length,
          2: ratings.filter(r => r >= 2 && r < 3).length,
          3: ratings.filter(r => r >= 3 && r < 4).length,
          4: ratings.filter(r => r >= 4 && r < 5).length,
          5: ratings.filter(r => r === 5).length,
        },
      };

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch review stats',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}