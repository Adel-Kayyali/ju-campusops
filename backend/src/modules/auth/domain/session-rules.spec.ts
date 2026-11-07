import { checkSession, SessionRejection } from './session-rules';

describe('checkSession', () => {
  it('accepts a token issued for the current token version of an active account', () => {
    expect(checkSession({ ver: 3 }, { isActive: true, tokenVersion: 3 })).toBeNull();
  });

  it('rejects tokens of deleted accounts', () => {
    expect(checkSession({ ver: 0 }, null)).toBe(SessionRejection.ACCOUNT_NOT_FOUND);
  });

  it('rejects tokens of deactivated accounts immediately', () => {
    expect(checkSession({ ver: 0 }, { isActive: false, tokenVersion: 0 })).toBe(SessionRejection.ACCOUNT_DEACTIVATED);
  });

  it('rejects tokens issued before a logout / password change / role change', () => {
    expect(checkSession({ ver: 1 }, { isActive: true, tokenVersion: 2 })).toBe(SessionRejection.TOKEN_REVOKED);
  });
});
