import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('navigation')
  getNavigation() {
    return this.appService.getNavigation();
  }

  @Get('navigation/:slug/categories')
  getCategories(@Param('slug') slug: string) {
    return this.appService.getCategories(slug);
  }

  @Post('scrape/categories')
  scrapeCategories(@Body() body: { navigationId: string }) {
    return this.appService.scrapeCategories(body.navigationId);
  }
}