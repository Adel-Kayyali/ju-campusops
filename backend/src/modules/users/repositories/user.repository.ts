import { Injectable } from '@nestjs/common';
import { Prisma, Role, User } from '@prisma/client';
import { BaseRepository } from '../../../database/base.repository';
import { TransactionManager } from '../../../database/transaction-manager';

@Injectable()
export class UserRepository extends BaseRepository {
  constructor(transactionManager: TransactionManager) {
    super(transactionManager);
  }

  findById(id: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { id } });
  }

  findByUniversityId(universityId: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { universityId } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { email: email.toLowerCase() } });
  }

  async findPage(
    where: Prisma.UserWhereInput,
    orderBy: Prisma.UserOrderByWithRelationInput,
    skip: number,
    take: number,
  ): Promise<[User[], number]> {
    return Promise.all([this.db.user.findMany({ where, orderBy, skip, take }), this.db.user.count({ where })]);
  }

  create(data: Prisma.UserCreateInput): Promise<User> {
    return this.db.user.create({ data });
  }

  update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.db.user.update({ where: { id }, data });
  }

  /** Invalidates every token issued so far for this user (see JwtAuthGuard). */
  async revokeSessions(id: string): Promise<void> {
    await this.db.user.update({ where: { id }, data: { tokenVersion: { increment: 1 } } });
  }

  countByRole(): Promise<{ role: Role; _count: { _all: number } }[]> {
    return this.db.user.groupBy({ by: ['role'], _count: { _all: true } }) as unknown as Promise<{ role: Role; _count: { _all: number } }[]>;
  }
}
