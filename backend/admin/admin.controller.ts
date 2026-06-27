import { Controller, Post, Query, UnauthorizedException } from '@nestjs/common';
import { AutoSeedService } from 'src/prisma/auto-seed.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly autoSeed: AutoSeedService) {}

  @Post('reseed')
  async reseed(@Query('secret') secret: string) {
    if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) {
      throw new UnauthorizedException();
    }
    const result = await this.autoSeed.seed();
    return { success: true, result };
  }
}
