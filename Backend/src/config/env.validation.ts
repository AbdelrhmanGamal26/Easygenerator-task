import { plainToInstance } from 'class-transformer';
import {
  Min,
  IsIn,
  IsInt,
  IsString,
  MinLength,
  IsOptional,
  validateSync,
} from 'class-validator';

export class EnvironmentVariables {
  @IsIn(['development', 'production', 'test'])
  @IsOptional()
  NODE_ENV: string = 'development';

  @IsInt()
  @Min(1)
  @IsOptional()
  PORT: number = 3000;

  @IsString()
  MONGODB_URI: string;

  @IsString()
  @MinLength(32)
  JWT_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN: string = '15m';

  @IsInt()
  @Min(1)
  @IsOptional()
  REFRESH_TOKEN_TTL_DAYS: number = 7;

  @IsIn(['lax', 'strict', 'none'])
  @IsOptional()
  COOKIE_SAME_SITE: 'lax' | 'strict' | 'none' = 'lax';

  @IsString()
  @IsOptional()
  CORS_ORIGIN: string = 'http://localhost:5173';

  // Number of reverse-proxy hops in front of the app; 0 disables `trust proxy`.
  @IsInt()
  @Min(0)
  @IsOptional()
  TRUST_PROXY: number = 0;

  @IsString()
  @IsOptional()
  LOG_LEVEL: string = 'info';
}

// Origins are compared verbatim, so a trailing slash or stray space would block every request.
const normalizeOrigins = (value: string): string =>
  value
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean)
    .join(',');

export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration:\n${errors.toString()}`);
  }
  if (
    validated.NODE_ENV === 'production' &&
    validated.JWT_SECRET.startsWith('change-me')
  ) {
    throw new Error(
      'JWT_SECRET must not be the example placeholder in production',
    );
  }
  validated.CORS_ORIGIN = normalizeOrigins(validated.CORS_ORIGIN);
  return validated;
}
