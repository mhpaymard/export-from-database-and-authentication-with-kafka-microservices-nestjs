import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3001;
  await app.listen(port);

  logger.log(`🚀 Auth Service is running on: http://localhost:${port}`);
  logger.log(`📡 Kafka broker: ${process.env.KAFKA_BROKER}`);
  logger.log(`📨 Listening on topic: ${process.env.KAFKA_AUTH_REQUEST_TOPIC}`);
}

bootstrap();
