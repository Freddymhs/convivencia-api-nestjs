import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { ENV_KEYS } from '@config/env.constants.js';
import { EnvModule } from './config/env.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { ExampleModule } from './modules/example/example.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { GLOBAL_VALIDATION_PIPE } from './common/pipes/validation.pipe';

@Module({
  imports: [
    EnvModule,

    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          level: config.get<string>(ENV_KEYS.PINO_LOG_LEVEL, 'info'),
          transport:
            config.get<string>(ENV_KEYS.NODE_ENV) !== 'production'
              ? { target: 'pino-pretty', options: { colorize: true } }
              : undefined,
          autoLogging: true,
          genReqId: () => crypto.randomUUID(),
        },
      }),
    }),

    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>(ENV_KEYS.THROTTLE_TTL, 60) * 1000,
            limit: config.get<number>(ENV_KEYS.THROTTLE_LIMIT, 100),
          },
        ],
      }),
    }),

    DatabaseModule,
    HealthModule,
    ExampleModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_PIPE, useValue: GLOBAL_VALIDATION_PIPE },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
