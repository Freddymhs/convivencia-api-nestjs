import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

export const EnvModule = ConfigModule.forRoot({
  isGlobal: true,
  validationSchema: Joi.object({
    NODE_ENV: Joi.string()
      .valid('development', 'production', 'test')
      .default('development'),
    PORT: Joi.number().default(3000),
    DATABASE_URL: Joi.string().required(),
    CORS_ORIGINS: Joi.string().default('http://localhost:3001'),
    PINO_LOG_LEVEL: Joi.string()
      .valid('trace', 'debug', 'info', 'warn', 'error', 'fatal')
      .default('info'),
    THROTTLE_TTL: Joi.number().default(60),
    THROTTLE_LIMIT: Joi.number().default(100),
  }),
  validationOptions: { abortEarly: false },
});
