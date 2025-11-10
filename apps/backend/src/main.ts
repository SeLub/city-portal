// apps/backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3002'],
    credentials: true,
  });

  app.use(cookieParser());

    // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('City Portal API')
    .setDescription('The City Portal API description')
    .setVersion('1.0')
    .addCookieAuth('auth_token') // For protected routes
    .build();
  const document = SwaggerModule.createDocument(app, config);
  if (process.env.NODE_ENV !== 'production') {
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
  
  await app.listen(port);

  // Get the actual address (useful if port=0 or dynamic)
  const url = await app.getUrl();
  console.log(`\n🚀 NestJS server is running on: ${url}`);
  console.log(`📘 Swagger UI available at: ${url}/api/docs\n`);
}

bootstrap();