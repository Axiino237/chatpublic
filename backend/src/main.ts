import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3001', 'http://127.0.0.1:5173', 'http://127.0.0.1:3001'],
    credentials: true,
  });

  app.setGlobalPrefix('api');

  // Simple Request Logger
  const httpLogger = new Logger('HTTP');
  app.use((req, res, next) => {
    httpLogger.log(`${req.method} ${req.originalUrl || req.url}`);
    next();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('LoveLink API')
    .setDescription('API documentation for LoveLink')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT-auth')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
}
bootstrap().catch(e => {
  console.error('❌ Bootstrap Error:', e.message);
  // console.error(e.stack); // Stack might be huge if it includes the object dump in the stack property? No, stack is string.
  if (e.stack) console.error(e.stack);
  process.exit(1);
});
