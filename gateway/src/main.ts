import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('API Gateway - Microservices')
    .setDescription(
      `
      # API Gateway Documentation
      
      This is the API Gateway for the microservices architecture.
      
      ## Features
      - 🔐 Authentication & Authorization
      - 📊 Database Export Service
      - 🏥 Health Check Endpoints
      - 📡 Kafka-based Communication
      
      ## Authentication
      Most endpoints require a Bearer token obtained from the login endpoint.
      
      ### User Roles
      - **admin**: Full access to all endpoints including database export
      - **user**: Limited access, cannot export database
      
      ## Getting Started
      1. Register a new user with POST /api/auth/register
      2. Login with POST /api/auth/login to get a token
      3. Use the token in the Authorization header: \`Bearer <token>\`
      4. Access protected endpoints
      
      ## Topics
      The gateway communicates with microservices via Kafka:
      - \`auth.request\` / \`auth.response\` - Authentication service
      - \`export.request\` / \`export.response\` - Export service
      `,
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Health', 'Health check and status endpoints')
    .addTag('Authentication', 'User authentication and authorization')
    .addTag('Database Export', 'Database export service (admin only)')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'API Gateway Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
  logger.log(`🏥 Health check: http://localhost:${port}/health`);
  logger.log(`📡 Kafka broker: ${process.env.KAFKA_BROKER || 'localhost:9092'}`);
}

bootstrap();
