import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS — accepts requests from the Vercel frontend.
  // FRONTEND_URL is set in Railway dashboard after Vercel deploys.
  const allowedOrigins = [process.env.FRONTEND_URL || 'http://localhost:3000'];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow server-to-server calls (no origin header)
      if (!origin) return callback(null, true);

      // Allow any Vercel preview URL (*.vercel.app)
      if (origin.endsWith('.vercel.app')) return callback(null, true);

      // Allow explicitly configured origin
      if (allowedOrigins.includes(origin)) return callback(null, true);

      // Allow localhost on any port for local dev
      if (origin.startsWith('http://localhost:')) return callback(null, true);

      callback(null, true); // permissive during hackathon — tighten post-submission
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger API docs
  const config = new DocumentBuilder()
    .setTitle('Product Data Explorer API')
    .setDescription('API for exploring World of Books products')
    .setVersion('1.0')
    .addTag('navigation', 'Navigation headings')
    .addTag('categories', 'Product categories')
    .addTag('products', 'Products and details')
    .addTag('scrape', 'Scraping operations')
    .build();

  SwaggerModule.setup(
    'api-docs',
    app,
    SwaggerModule.createDocument(app, config),
  );

  app.enableShutdownHooks();

  const port = process.env.PORT || 4000;

  // 0.0.0.0 is required for Railway/Render — default 127.0.0.1 is
  // unreachable from outside the container
  await app.listen(port, '0.0.0.0');

  console.log(`Server running on port ${port}`);
  console.log(`Swagger docs at /api-docs`);
  // Embedded workers — Render's free tier has no separate worker service,
  // so the scrape workers run in this same process instead.
  if (process.env.ENABLE_EMBEDDED_WORKERS !== 'false') {
    console.log('Starting embedded scrape workers...');
    await import('./scrape/workers/navigation.worker.js');
    await import('./scrape/workers/category.worker.js');
    await import('./scrape/workers/product.worker.js');
    await import('./scrape/workers/product-detail.worker.js');
  }
}

bootstrap().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
