// backend/src/api/controllers/categories.controller.ts
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('by-navigation/:navigationId')
  @ApiOperation({ summary: 'Get categories by navigation ID' })
  @ApiParam({ name: 'navigationId', description: 'Navigation ID' })
  async getCategoriesByNavigation(@Param('navigationId') navigationId: string) {
    const categories = await this.prisma.category.findMany({
      where: {
        navigationId: parseInt(navigationId),
        parentId: null, // Only top-level categories
      },
      include: {
        children: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: { title: 'asc' },
    });

    return {
      success: true,
      data: categories,
      count: categories.length,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  async getCategory(@Param('id') id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: parseInt(id) },
      include: {
        navigation: true,
        children: true,
        products: {
          take: 10,
          orderBy: { lastScrapedAt: 'desc' },
        },
      },
    });

    if (!category) {
      return {
        success: false,
        error: 'Category not found',
      };
    }

    return {
      success: true,
      data: category,
    };
  }
}