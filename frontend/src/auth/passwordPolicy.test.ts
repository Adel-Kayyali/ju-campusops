import { describe, expect, it } from 'vitest';
import { isStrongPassword, passwordError } from './passwordPolicy';

describe('password policy (client mirror)', () => {
  it('accepts a password that follows every rule', () => {
    expect(isStrongPassword('Password123!')).toBe(true);
    expect(passwordError('Campus#2026x', 'sara@campusops.edu')).toBeNull();
  });

  it('explains what is missing', () => {
    expect(passwordError('password')).toContain('an uppercase letter (A-Z)');
    expect(isStrongPassword('Adel1234!x', 'adel@campusops.edu')).toBe(false);
  });
});
