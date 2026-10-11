import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import { ACCESS_TOKEN_COOKIE } from './auth/utils/auth-cookie.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  const config = app.get(ConfigService);
  const logger = app.get(Logger);

  // Route Nest's internal logs through Pino
  app.useLogger(logger);

  // Behind a reverse proxy, use the forwarded client IP so rate limits are per user
  const proxyHops = config.getOrThrow<number>('TRUST_PROXY');
  if (proxyHops > 0) app.set('trust proxy', proxyHops);

  // Secure HTTP headers
  app.use(helmet());

  // Populate req.cookies so the JWT strategy can read the auth cookies
  app.use(cookieParser());

  // Allow the frontend origin(s) to send cookies cross-origin
  app.enableCors({
    origin: config.getOrThrow<string>('CORS_ORIGIN').split(','),
    credentials: true,
    exposedHeaders: ['X-Request-Id'],
  });

  // Close the DB connection cleanly on SIGTERM/SIGINT
  app.enableShutdownHooks();

  // Reject unknown fields and coerce payloads into DTO types
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Uniform error responses and error logging
  app.useGlobalFilters(new AllExceptionsFilter(logger));

  // Expose Swagger UI outside production only
  if (config.get('NODE_ENV') !== 'production') {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Auth API')
        .setDescription('Sign up / sign in API')
        .setVersion('1.0')
        .addBearerAuth()
        .addCookieAuth(ACCESS_TOKEN_COOKIE)
        .build(),
    );
    SwaggerModule.setup('docs', app, document);
  }

  const port = config.getOrThrow<number>('PORT');
  await app.listen(port);
  logger.log(`Listening on port ${port}`);
}
await bootstrap();
