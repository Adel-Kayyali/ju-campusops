import { plainToInstance } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min, validateSync } from 'class-validator';

/**
 * Typed description of every environment variable the API reads.
 * The application refuses to start when a required variable is missing or invalid
 * (fail-fast, like Spring's @Validated @ConfigurationProperties).
 */
export class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 4000;

  @IsOptional()
  @IsString()
  CORS_ORIGINS: string = 'http://localhost:5173';

  @IsString()
  @IsNotEmpty()
  JWT_SECRET: string;

  @IsOptional()
  @IsString()
  JWT_EXPIRES_IN: string = '8h';

  @IsOptional()
  @IsIn(['local', 'vercel-blob'])
  STORAGE_DRIVER: 'local' | 'vercel-blob' = 'local';

  @IsOptional()
  @IsString()
  BLOB_READ_WRITE_TOKEN?: string;

  @IsOptional()
  @IsString()
  PUBLIC_API_URL: string = 'http://localhost:4000';

  @IsOptional()
  @IsString()
  CRON_SECRET?: string;

  @IsOptional()
  @IsString()
  APP_TIMEZONE: string = 'Asia/Amman';
}

export function validateEnvironment(config: Record<string, unknown>): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, { enableImplicitConversion: true });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    const messages = errors.map((e) => `${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`);
    throw new Error(`Invalid environment configuration:\n  - ${messages.join('\n  - ')}`);
  }
  return validated;
}
