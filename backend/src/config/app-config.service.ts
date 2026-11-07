import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from './environment.validation';

export type StorageDriver = 'local' | 'vercel-blob';

/**
 * Strongly-typed facade over the environment configuration.
 * Inject this class instead of reading process.env directly.
 */
@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService<EnvironmentVariables, true>) {}

  get port(): number {
    return this.config.get('PORT', { infer: true });
  }

  get corsOrigins(): string[] {
    return this.config
      .get('CORS_ORIGINS', { infer: true })
      .split(',')
      .map((origin: string) => origin.trim())
      .filter(Boolean);
  }

  get jwtSecret(): string {
    return this.config.get('JWT_SECRET', { infer: true });
  }

  get jwtExpiresIn(): string {
    return this.config.get('JWT_EXPIRES_IN', { infer: true });
  }

  get storageDriver(): StorageDriver {
    return this.config.get('STORAGE_DRIVER', { infer: true });
  }

  get blobToken(): string | undefined {
    return this.config.get('BLOB_READ_WRITE_TOKEN', { infer: true });
  }

  get publicApiUrl(): string {
    return this.config.get('PUBLIC_API_URL', { infer: true }).replace(/\/$/, '');
  }

  get cronSecret(): string | undefined {
    return this.config.get('CRON_SECRET', { infer: true });
  }

  get timezone(): string {
    return this.config.get('APP_TIMEZONE', { infer: true });
  }
}
