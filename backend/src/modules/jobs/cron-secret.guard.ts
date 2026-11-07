import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { AppConfigService } from '../../config/app-config.service';

/** Vercel Cron calls the job with "Authorization: Bearer <CRON_SECRET>". */
@Injectable()
export class CronSecretGuard implements CanActivate {
  constructor(private readonly config: AppConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const secret = this.config.cronSecret;
    const header = context.switchToHttp().getRequest<Request>().headers.authorization;
    if (!secret || header !== `Bearer ${secret}`) {
      throw new UnauthorizedException('Invalid cron secret');
    }
    return true;
  }
}
