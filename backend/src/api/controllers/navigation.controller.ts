// backend/src/api/controllers/navigation.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('navigation')
@Controller('navigation')
export class NavigationController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Get all navigation headings' })
  @ApiResponse({ status: 200, description: 'List of navigation items' })
  async getNavigation() {
    const navItems = await this.prisma.navigation.findMany({
      orderBy: { title: 'asc' },
      select: {
        id: true,
        title: true,
        slug: true,
        lastScrapedAt: true,
        _count: {
          select: {
            categories: true,
          },
        },
      },
    });

    return {
      success: true,
      data: navItems,
      timestamp: new Date().toISOString(),
    };
  }
}