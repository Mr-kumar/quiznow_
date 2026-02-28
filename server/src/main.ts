import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  RateLimitMiddleware,
  AuthRateLimitMiddleware,
  UploadRateLimitMiddleware,
} from './common/middleware/rate-limit.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 🛡️ Rate Limiting Middleware (DRY approach)
  app.use('/auth', new AuthRateLimitMiddleware());
  app.use('/questions/upload', new UploadRateLimitMiddleware());
  app.use(new RateLimitMiddleware());

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
