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
  if (process.env.REDIS_URL) {
    // Parse Redis URL (format: redis://hostname:port)
    const url = new URL(process.env.REDIS_URL);
    return {
      host: url.hostname,
      port: parseInt(url.port || '6379'),
    };
  }
  // Fallback for local development
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