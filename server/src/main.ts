import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { rateLimit } from 'express-rate-limit';
import { BigIntInterceptor } from './common/interceptors/bigint.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 🌐 Set Global API Prefix
  app.setGlobalPrefix('api');

  // 🛡️ Rate Limiting Middleware (Fixed - more lenient for development)
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // Increased from 100 to 1000 for development
      message:
        'Too many requests from this IP, please try again after 15 minutes',
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    }),
  );

  // 🛡️ Stricter rate limiting for auth endpoints
  app.use(
    '/auth',
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
    '/questions/upload',
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

  // 🌐 Rule 2: CORS (Allow Frontend Access)
  app.enableCors({
    origin: process.env.FRONTEND_URL || ['http://localhost:3000'],
    credentials: true,
  });

  // 🔁 Global interceptor to serialize BigInt to string in all responses
  app.useGlobalInterceptors(new BigIntInterceptor());

  // 📚 Rule 3: Swagger (Documentation)
  const config = new DocumentBuilder()
    .setTitle('QuizNow API')
    .setDescription('The Enterprise Backend Engine')
    .setVersion('1.0')
    .addBearerAuth() // Adds the "Token" button
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // 🚀 Start
  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}/api`);
  console.log(`📚 Swagger docs available at http://localhost:${port}/api`);
}
bootstrap();
