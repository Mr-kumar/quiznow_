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

  // 🛡️ Rate Limiting Strategy (Per-endpoint limiting to avoid blocking normal exam activity)
  const isProd = process.env.NODE_ENV === 'production';

  // 1. 🛡️ Auth endpoints (Strict)
  app.use(
    '/api/auth',
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 20, // Strict limit for login/oauth
      message:
        'Too many authentication attempts, please try again after 15 minutes',
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // 2. 🛡️ Exam activity (High volume - PATCH /attempts/:id/answers)
  app.use(
    '/api/attempts',
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 600, // Higher limit to allow saving 100+ answers + navigations
      message: 'Too many actions in your exam session. Please wait a moment.',
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // 3. 🛡️ Admin uploads
  app.use(
    '/api/questions/upload',
    rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10, // Strict limit for heavy processing
      message: 'Upload limit exceeded. Maximum 10 uploads per hour.',
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // 4. 🛡️ General API (Fallback for all other routes like /subjects, /categories)
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: isProd ? 1000 : 5000, // Generous limit for browsing
      message: 'Too many requests, please try again later',
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req: any) =>
        req.path.startsWith('/api/auth') ||
        req.path.startsWith('/api/attempts') ||
        req.path.startsWith('/api/questions/upload'),
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
  SwaggerModule.setup('docs', app, document); // C-5 fix: moved from 'api' to 'docs'

  // 🚀 Start
  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}/api`);
  console.log(`📚 Swagger docs available at http://localhost:${port}/docs`);
}
bootstrap();
