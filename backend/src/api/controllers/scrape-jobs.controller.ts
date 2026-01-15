// src/api/controllers/scrape-jobs.controller.ts
import { Controller, Get, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('scrape-jobs')
@Controller('scrape-jobs')
export class ScrapeJobsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Get scrape jobs with filters' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getScrapeJobs(
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    try {
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      const where: any = {};
      if (status) where.status = status;
      if (type) where.targetType = type;

      const [jobs, total] = await Promise.all([
        this.prisma.scrapeJob.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: { startedAt: 'desc' },
        }),
        this.prisma.scrapeJob.count({ where }),
      ]);

      return {
        success: true,
        data: jobs,
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
          message: 'Failed to fetch scrape jobs',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get scrape job by ID' })
  @ApiParam({ name: 'id', description: 'Scrape Job ID', type: String })
  async getScrapeJob(@Param('id') id: string) {
    try {
      const job = await this.prisma.scrapeJob.findUnique({
        where: { id: parseInt(id) },
      });

      if (!job) {
        throw new HttpException('Scrape job not found', HttpStatus.NOT_FOUND);
      }

      return {
        success: true,
        data: job,
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch scrape job',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stats/summary')
  @ApiOperation({ summary: 'Get scrape job statistics summary' })
  async getScrapeStats() {
    try {
      const total = await this.prisma.scrapeJob.count();
      const success = await this.prisma.scrapeJob.count({ where: { status: 'SUCCESS' } });
      const failed = await this.prisma.scrapeJob.count({ where: { status: 'FAILED' } });
      const running = await this.prisma.scrapeJob.count({ where: { status: 'RUNNING' } });
      const skipped = await this.prisma.scrapeJob.count({ where: { status: 'SKIPPED' } });

      // Get recent jobs (last 24 hours)
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentJobs = await this.prisma.scrapeJob.count({
        where: { startedAt: { gte: twentyFourHoursAgo } },
      });

      return {
        success: true,
        data: {
          total,
          success,
          failed,
          running,
          skipped,
          successRate: total > 0 ? (success / total) * 100 : 0,
          recent24h: recentJobs,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch scrape stats',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}