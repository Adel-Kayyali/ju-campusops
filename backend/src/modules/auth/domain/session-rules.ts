import { Role } from '@prisma/client';

/** Claims stored inside every access token. */
export interface AccessTokenPayload {
  /** User id. */
  sub: string;
  /** User.tokenVersion at the time the token was issued. */
  ver: number;
  email: string;
  name: string;
  role: Role;
}

/** The current state of the account, loaded from the database on every request. */
export interface AccountState {
  isActive: boolean;
  tokenVersion: number;
}

export enum SessionRejection {
  ACCOUNT_NOT_FOUND = 'ACCOUNT_NOT_FOUND',
  ACCOUNT_DEACTIVATED = 'ACCOUNT_DEACTIVATED',
  TOKEN_REVOKED = 'TOKEN_REVOKED',
}

/**
 * Decides whether a (correctly signed, not expired) token may still be used.
 * A token is revoked as soon as the user's tokenVersion moves on
 * (logout, password change, deactivation, role change).
 */
export function checkSession(payload: Pick<AccessTokenPayload, 'ver'>, account: AccountState | null): SessionRejection | null {
  if (!account) return SessionRejection.ACCOUNT_NOT_FOUND;
  if (!account.isActive) return SessionRejection.ACCOUNT_DEACTIVATED;
  if (payload.ver !== account.tokenVersion) return SessionRejection.TOKEN_REVOKED;
  return null;
}
