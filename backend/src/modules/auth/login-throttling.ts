import { ThrottlerModuleOptions } from '@nestjs/throttler';
import { AppConfigService } from '../../config/app-config.service';

/**
 * Login brute-force protection. Attempts are counted per (IP address + e-mail), so many students
 * behind the same campus network can still log in, while guessing one account's password is slowed down.
 *
 * Counters are kept in memory: on serverless hosting each running instance counts separately,
 * which still blocks fast automated guessing.
 */
export function loginThrottlingOptions(config: AppConfigService): ThrottlerModuleOptions {
  return {
    throttlers: [{ name: 'login', ttl: config.loginWindowSeconds * 1000, limit: config.loginMaxAttempts }],
    errorMessage: 'Too many login attempts. Please wait a minute and try again.',
    getTracker: (request: Record<string, any>) => {
      const email = typeof request.body?.email === 'string' ? request.body.email.trim().toLowerCase() : '';
      return `${request.ip as string}|${email}`;
    },
  };
}
