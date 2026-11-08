/**
 * Same password rules as the API (backend/src/common/security/password-policy.ts),
 * used for the live checklist. The API always checks again.
 */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;

export interface PasswordRule {
  code: string;
  label: string;
  test: (password: string, email: string) => boolean;
}

export const PASSWORD_RULES: readonly PasswordRule[] = [
  { code: 'LENGTH', label: `${PASSWORD_MIN_LENGTH}–${PASSWORD_MAX_LENGTH} characters`, test: (p) => p.length >= PASSWORD_MIN_LENGTH && p.length <= PASSWORD_MAX_LENGTH },
  { code: 'LOWERCASE', label: 'A lowercase letter (a-z)', test: (p) => /[a-z]/.test(p) },
  { code: 'UPPERCASE', label: 'An uppercase letter (A-Z)', test: (p) => /[A-Z]/.test(p) },
  { code: 'DIGIT', label: 'A number (0-9)', test: (p) => /\d/.test(p) },
  { code: 'SYMBOL', label: 'A symbol (e.g. ! @ # $ % _ -)', test: (p) => /[^A-Za-z0-9\s]/.test(p) },
  { code: 'NO_SPACES', label: 'No spaces', test: (p) => !/\s/.test(p) },
  {
    code: 'NOT_EMAIL',
    label: 'Does not contain your e-mail name',
    test: (p, email) => {
      const name = email.split('@')[0]?.toLowerCase() ?? '';
      return name.length < 3 || !p.toLowerCase().includes(name);
    },
  },
];

export function isStrongPassword(password: string, email = ''): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password, email));
}

/** For form validators: null when valid, otherwise a short message. */
export function passwordError(password: string, email = ''): string | null {
  const broken = PASSWORD_RULES.filter((rule) => !rule.test(password, email));
  return broken.length === 0 ? null : `Password needs: ${broken.map((rule) => rule.label.charAt(0).toLowerCase() + rule.label.slice(1)).join(', ')}`;
}
