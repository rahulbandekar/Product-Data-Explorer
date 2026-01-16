// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS - allow all origins for now (restrict later when you have frontend)
  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));
  
  // Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('Product Data Explorer API')
    .setDescription('API for exploring World of Books products')
    .setVersion('1.0')
    .addTag('navigation', 'Navigation headings')
    .addTag('categories', 'Product categories')
    .addTag('products', 'Products and details')
    .addTag('scrape', 'Scraping operations')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);
  
  // Enable shutdown hooks
  app.enableShutdownHooks();
  
  const port = process.env.PORT || 10000;
  await app.listen(port);
  
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📚 Swagger docs at /api-docs`);
}

bootstrap().catch((error) => {
  console.error('💥 Failed to start application:', error);
  process.exit(1);
});