import { IsBoolean, IsOptional, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ScrapeRequestDto {
  @ApiPropertyOptional({ description: 'Force scrape even if cached' })
  @IsOptional()
  @IsBoolean()
  force?: boolean = false;

  @ApiPropertyOptional({ description: 'Specific URL to scrape' })
  @IsOptional()
  @IsUrl()
  url?: string;
}