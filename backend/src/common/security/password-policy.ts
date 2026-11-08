/**
 * Password rules applied everywhere a password is chosen
 * (sign-up, change password, admin create / reset).
 * The web client shows the same rules as a live checklist.
 */
export const PASSWORD_MIN_LENGTH = 8;
/** bcrypt only uses the first 72 bytes of a password. */
export const PASSWORD_MAX_LENGTH = 72;

export interface PasswordRule {
  code: string;
  message: string;
  test: (password: string, context: PasswordContext) => boolean;
}

export interface PasswordContext {
  email?: string;
}

export const PASSWORD_RULES: readonly PasswordRule[] = [
  { code: 'LENGTH', message: `Between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_LENGTH} characters`, test: (p) => p.length >= PASSWORD_MIN_LENGTH && p.length <= PASSWORD_MAX_LENGTH },
  { code: 'LOWERCASE', message: 'At least one lowercase letter (a-z)', test: (p) => /[a-z]/.test(p) },
  { code: 'UPPERCASE', message: 'At least one uppercase letter (A-Z)', test: (p) => /[A-Z]/.test(p) },
  { code: 'DIGIT', message: 'At least one number (0-9)', test: (p) => /\d/.test(p) },
  { code: 'SYMBOL', message: 'At least one symbol (e.g. ! @ # $ % _ -)', test: (p) => /[^A-Za-z0-9\s]/.test(p) },
  { code: 'NO_SPACES', message: 'No spaces', test: (p) => !/\s/.test(p) },
  {
    code: 'NOT_EMAIL',
    message: 'Must not contain your e-mail name',
    test: (p, { email }) => {
      const name = email?.split('@')[0]?.toLowerCase() ?? '';
      return name.length < 3 || !p.toLowerCase().includes(name);
    },
  },
];

/** Returns the rules the password breaks (empty array = strong enough). */
export function passwordProblems(password: string, context: PasswordContext = {}): PasswordRule[] {
  return PASSWORD_RULES.filter((rule) => !rule.test(password, context));
}
