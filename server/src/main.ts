import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { rateLimit } from 'express-rate-limit';
import { BigIntInterceptor } from './common/interceptors/bigint.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // 🌐 Set Global API Prefix
  app.setGlobalPrefix('api');

  // 🛡️ Rate Limiting Middleware (env-dependent limits)
  const isProd = process.env.NODE_ENV === 'production';
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: isProd ? 100 : 1000,
      message:
        'Too many requests from this IP, please try again after 15 minutes',
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    }),
  );

  // 🛡️ Stricter rate limiting for auth endpoints (C-4 fix: include /api prefix)
  app.use(
    '/api/auth',
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Increased from 10 to 100 for development
      message:
        'Too many authentication attempts, please try again after 15 minutes',
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // 🛡️ Rate limiting for file uploads
  app.use(
    '/api/questions/upload', // ✅ FIXED: include /api prefix
    rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 20, // Increased from 5 to 20 for development
      message: 'Upload limit exceeded. Maximum 20 uploads per hour.',
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // 🛡️ Rule 1: Validation (Protect against bad data)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip out fields we didn't ask for
      forbidNonWhitelisted: true, // Throw error if extra fields are sent
      transform: true, // Automatically convert "123" (string) to 123 (number)
      forbidUnknownValues: false, // Allow unknown values (more flexible)
    }),
  );

  // 🌐 Rule 2: CORS (Allow Frontend Access) — L-4 fix: split comma-separated env var
  app.enableCors({
    origin: process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.split(',')
      : ['http://localhost:3000'],
    credentials: true,
  });

  // 🔁 Global interceptor to serialize BigInt to string in all responses
  app.useGlobalInterceptors(new BigIntInterceptor());

  // 🛡️ Global exception filter — prevents raw stack traces from leaking (L-5)
  app.useGlobalFilters(new AllExceptionsFilter());

  // 📚 Rule 3: Swagger (Documentation)
  const config = new DocumentBuilder()
    .setTitle('QuizNow API')
    .setDescription('The Enterprise Backend Engine')
    .setVersion('1.0')
    .addBearerAuth() // Adds the "Token" button
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);  // C-5 fix: moved from 'api' to 'docs'

  // 🚀 Start
  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}/api`);
  console.log(`📚 Swagger docs available at http://localhost:${port}/docs`);
}
bootstrap();
