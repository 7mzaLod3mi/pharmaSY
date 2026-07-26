import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // ─── Logger ───────────────────────────────────────────────────────────────
  app.useLogger(app.get(Logger));

  // ─── Cookie Parser ────────────────────────────────────────────────────────
  app.use(cookieParser());

  // ─── CORS ─────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
  });

  // ─── API Versioning ───────────────────────────────────────────────────────
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // ─── Global Validation ────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ─── Swagger ──────────────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('PharmaSY API')
      .setDescription('B2B Pharmacy Marketplace API – v1')
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management')
      .addTag('pharmacies', 'Pharmacy management')
      .addTag('suppliers', 'Supplier management')
      .addTag('products', 'Product catalog')
      .addTag('marketplace', 'Marketplace & search')
      .addTag('orders', 'Order management')
      .addTag('inventory', 'Inventory management')
      .addTag('pos', 'In-store pharmacy point-of-sale')
      .addTag('notifications', 'Notification center')
      .addTag('exchange', 'C2C Exchange marketplace')
      .addTag('reports', 'Reports & analytics')
      .addTag('admin', 'Admin operations')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🚀 PharmaSY API running at: http://localhost:${port}/api/v1`);
  console.log(`📚 Swagger docs at:         http://localhost:${port}/api/docs`);
}

void bootstrap();
