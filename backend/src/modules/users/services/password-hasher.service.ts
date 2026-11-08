import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { WeakPasswordException } from '../../../common/exceptions/domain.exceptions';
import { PasswordContext, passwordProblems } from '../../../common/security/password-policy';

/** One place that knows how passwords are checked and hashed (bcrypt, cost 10). */
@Injectable()
export class PasswordHasher {
  private static readonly COST = 10;

  hash(plainText: string): Promise<string> {
    return bcrypt.hash(plainText, PasswordHasher.COST);
  }

  /** Checks a NEW password against the password policy, then hashes it. */
  async hashNewPassword(plainText: string, context: PasswordContext = {}): Promise<string> {
    const problems = passwordProblems(plainText, context);
    if (problems.length > 0) {
      throw new WeakPasswordException(problems.map((rule) => rule.message));
    }
    return this.hash(plainText);
  }

  matches(plainText: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainText, hash);
  }
}
