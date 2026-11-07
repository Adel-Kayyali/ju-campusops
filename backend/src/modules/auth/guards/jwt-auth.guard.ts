import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';
import { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { UserRepository } from '../../users/repositories/user.repository';
import { AccessTokenPayload, checkSession, SessionRejection } from '../domain/session-rules';

const REJECTION_MESSAGES: Record<SessionRejection, string> = {
  ACCOUNT_NOT_FOUND: 'Your account no longer exists',
  ACCOUNT_DEACTIVATED: 'Your account has been deactivated',
  TOKEN_REVOKED: 'Your session has ended. Please sign in again',
};

/**
 * Global guard: every endpoint requires a valid "Authorization: Bearer <jwt>" header
 * unless it is annotated with @Public().
 *
 * Besides the signature and expiry, the account is re-checked in the database on every
 * request, so deactivation, role changes and logout take effect immediately. The role
 * used for authorization is always the CURRENT role from the database, not the one in the token.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly userRepository: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Missing access token');
    }

    let payload: AccessTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    const account = await this.userRepository.findById(payload.sub);
    const rejection = checkSession(payload, account);
    if (rejection || !account) {
      throw new UnauthorizedException(REJECTION_MESSAGES[rejection ?? SessionRejection.ACCOUNT_NOT_FOUND]);
    }

    request.user = { id: account.id, email: account.email, fullName: account.fullName, role: account.role };
    return true;
  }

  private extractToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
