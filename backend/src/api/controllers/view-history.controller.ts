// src/api/controllers/view-history.controller.ts
import { Controller, Post, Get, Body, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiQuery } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';

class TrackViewDto {
  sessionId: string;
  path: string;
  productId?: number;
  categoryId?: number;
}

@ApiTags('view-history')
@Controller('view-history')
export class ViewHistoryController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('track')
  @ApiOperation({ summary: 'Track a page view' })
  @ApiBody({ type: TrackViewDto })
  async trackView(@Body() body: TrackViewDto) {
    try {
      const { sessionId, path, productId, categoryId } = body;

      if (!sessionId || !path) {
        throw new HttpException('Session ID and path are required', HttpStatus.BAD_REQUEST);
      }

      const viewData = {
        sessionId,
        path,
        productId,
        categoryId,
        timestamp: new Date().toISOString(),
      };

      const view = await this.prisma.viewHistory.create({
        data: {
          sessionId,
          pathJson: viewData,
        },
      });

      return {
        success: true,
        data: view,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to track view',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent views for a session' })
  @ApiQuery({ name: 'sessionId', required: true, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getRecentViews(
    @Query('sessionId') sessionId: string,
    @Query('limit') limit: string = '50',
  ) {
    try {
      const limitNum = parseInt(limit);

      const views = await this.prisma.viewHistory.findMany({
        where: { sessionId },
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      });

      return {
        success: true,
        data: views.map(view => ({
          ...view,
          pathJson: typeof view.pathJson === 'string' 
            ? JSON.parse(view.pathJson) 
            : view.pathJson,
        })),
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch recent views',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('popular/products')
  @ApiOperation({ summary: 'Get most viewed products' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getPopularProducts(@Query('limit') limit: string = '10') {
    try {
      const limitNum = parseInt(limit);

      // Get all views and count product occurrences
      const views = await this.prisma.viewHistory.findMany({
        where: {
          pathJson: {
            string_contains: '/products/',     
        },
        },
        take: 1000, // Limit for performance
      });

      const productCounts: Record<number, number> = {};
      
      views.forEach(view => {
        const pathJson = typeof view.pathJson === 'string' 
          ? JSON.parse(view.pathJson) 
          : view.pathJson;
        
        if (pathJson.productId) {
          productCounts[pathJson.productId] = (productCounts[pathJson.productId] || 0) + 1;
        }
      });

      const popularProductIds = Object.entries(productCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, limitNum)
        .map(([productId]) => parseInt(productId));

      // Fetch product details
      const products = await this.prisma.product.findMany({
        where: { id: { in: popularProductIds } },
        include: {
          category: { select: { title: true } },
          detail: { select: { ratingsAvg: true } },
        },
      });

      // Sort by popularity count
      const sortedProducts = products.sort((a, b) => 
        (productCounts[b.id] || 0) - (productCounts[a.id] || 0)
      );

      return {
        success: true,
        data: sortedProducts.map(product => ({
          ...product,
          viewCount: productCounts[product.id] || 0,
        })),
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch popular products',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}