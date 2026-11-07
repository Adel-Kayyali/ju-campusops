import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

/** One place that knows how passwords are hashed (bcrypt, cost 10). */
@Injectable()
export class PasswordHasher {
  private static readonly COST = 10;

  hash(plainText: string): Promise<string> {
    return bcrypt.hash(plainText, PasswordHasher.COST);
  }

  matches(plainText: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainText, hash);
  }
}
