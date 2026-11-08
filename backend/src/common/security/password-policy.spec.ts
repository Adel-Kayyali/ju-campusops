import { passwordProblems } from './password-policy';

const codes = (password: string, email?: string) => passwordProblems(password, { email }).map((rule) => rule.code);

describe('password policy', () => {
  it('accepts a password that follows every rule', () => {
    expect(codes('Password123!')).toEqual([]);
    expect(codes('Campus#2026x', 'sara@campusops.edu')).toEqual([]);
  });

  it('reports each broken rule', () => {
    expect(codes('short1!')).toContain('LENGTH');
    expect(codes('password123!')).toEqual(['UPPERCASE']);
    expect(codes('PASSWORD123!')).toEqual(['LOWERCASE']);
    expect(codes('Password!!!!')).toEqual(['DIGIT']);
    expect(codes('Password1234')).toEqual(['SYMBOL']);
    expect(codes('Pass word12!')).toEqual(['NO_SPACES']);
  });

  it('rejects passwords longer than bcrypt can use', () => {
    expect(codes(`Aa1!${'x'.repeat(70)}`)).toContain('LENGTH');
  });

  it('rejects passwords containing the e-mail name', () => {
    expect(codes('Adel1234!x', 'adel@campusops.edu')).toEqual(['NOT_EMAIL']);
  });
});
