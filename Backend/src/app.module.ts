import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { validateEnv } from './config/env.validation.js';
import { CsrfGuard } from './common/guards/csrf.guard.js';
import { requestId } from './common/request-id.js';

@Module({
  imports: [
    // Global config; validateEnv fails startup on missing/invalid env vars
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),

    // Async so LOG_LEVEL/NODE_ENV come from the validated ConfigService
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProd = config.get('NODE_ENV') === 'production';
        return {
          pinoHttp: {
            level: config.getOrThrow<string>('LOG_LEVEL'),
            // Keep credentials out of the logs
            redact: [
              'req.headers.authorization',
              'req.headers.cookie',
              'res.headers["set-cookie"]',
            ],
            // Correlates every log line and error response of one request
            genReqId: requestId,
            // Pretty output in dev, plain JSON in production
            transport: isProd
              ? undefined
              : { target: 'pino-pretty', options: { singleLine: true } },
          },
        };
      },
    }),
    // Default rate limit: 100 requests/min per client (auth routes override it)
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),

    // Async so the connection string comes from the validated ConfigService
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGODB_URI'),
      }),
    }),
    UsersModule,
    AuthModule,
  ],

  // Apply the throttler and the CSRF origin check to every route
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    { provide: APP_GUARD, useClass: CsrfGuard },
  ],
})
export class AppModule {}
