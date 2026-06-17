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

// Parses all Redis URL formats:
//   Railway:  redis://default:password@host:port
//   Render:   redis://host:port
//   Local:    REDIS_HOST + REDIS_PORT env vars
function getRedisConnection() {
  const redisUrl = process.env.REDIS_URL;

  if (redisUrl) {
    try {
      // Normalise — some providers omit the scheme
      const normalised = redisUrl.startsWith('redis')
        ? redisUrl
        : `redis://${redisUrl}`;

      const url = new URL(normalised);

      return {
        host: url.hostname,
        port: parseInt(url.port || '6379'),
        // Only set password if present
        ...(url.password ? { password: decodeURIComponent(url.password) } : {}),
        // Only set username if it's not the Railway default "default"
        ...(url.username && url.username !== 'default'
          ? { username: url.username }
          : {}),
        // TLS for rediss:// connections (Render, Upstash)
        ...(normalised.startsWith('rediss://') ? { tls: {} } : {}),
      };
    } catch (e) {
      console.warn('Could not parse REDIS_URL, falling back to host/port:', e);
      // Last-resort fallback: treat REDIS_URL as plain host:port
      const [host, port] = redisUrl.split(':');
      return { host, port: parseInt(port || '6379') };
    }
  }

  // Local dev — use individual env vars
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
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
