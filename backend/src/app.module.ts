// src/app.module.ts
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { ScrapeModule } from './scrape/scrape.module';
import { ApiModule } from './api/api.module';
import { LoggingMiddleware } from './middleware/logging.middleware'; 
import { HealthController } from './health/health.controller';

// Helper function to parse Redis connection
function getRedisConnection() {
  const redisUrl = process.env.REDIS_URL;

  if (redisUrl) {
    const normalizedUrl = redisUrl.startsWith('redis://') ? redisUrl : `redis://${redisUrl}`;
    
    try {
      const parsed = new URL(normalizedUrl);
      return {
        host: parsed.hostname,
        port: parseInt(parsed.port || '6379'),
        password: parsed.password || undefined,
      };
    } catch (e) {
      return {
        host: redisUrl.split(':')[0],
        port: parseInt(redisUrl.split(':')[1] || '6379'),
      };
    }
  }

  return {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  };
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, 
        limit: 100, 
      },
    ]),
    
    BullModule.forRoot({
      connection: getRedisConnection(),
    }),
    
    PrismaModule,
    ScrapeModule,
    ApiModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggingMiddleware)
      .forRoutes('*');
  }
}
