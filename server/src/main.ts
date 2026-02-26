import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 🛡️ Rule 1: Validation (Protect against bad data)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip out fields we didn't ask for
      forbidNonWhitelisted: true, // Throw error if extra fields are sent
      transform: true, // Automatically convert "123" (string) to 123 (number)
    }),
  );

  // 🌐 Rule 2: CORS (Allow Frontend Access)
  app.enableCors({
    origin: ['http://localhost:3000'], // Your Frontend URL
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
  await app.listen(process.env.PORT || 4000);
  console.log(`🚀 Server running on http://localhost:4000/api`);
}
bootstrap();
