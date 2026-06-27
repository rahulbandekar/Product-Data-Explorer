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
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminController } from 'admin/admin.controller';
import { AutoSeedService } from './prisma/auto-seed.service';

function getRedisConnection() {
  const redisUrl = process.env.REDIS_URL;

  if (redisUrl) {
    try {
      const normalised = redisUrl.startsWith('redis')
        ? redisUrl
        : `redis://${redisUrl}`;

      const url = new URL(normalised);

      return {
        host: url.hostname,
        port: parseInt(url.port || '6379'),
        ...(url.password ? { password: decodeURIComponent(url.password) } : {}),
        ...(url.username && url.username !== 'default'
          ? { username: url.username }
          : {}),
        ...(normalised.startsWith('rediss://') ? { tls: {} } : {}),
      };
    } catch (e) {
      console.warn('Could not parse REDIS_URL, falling back to host/port:', e);
      const [host, port] = redisUrl.split(':');
      return { host, port: parseInt(port || '6379') };
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
  controllers: [HealthController, AppController, AdminController],
  providers: [
    AppService,
    AutoSeedService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
