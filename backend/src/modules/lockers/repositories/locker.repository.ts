import { Injectable } from '@nestjs/common';
import { Locker, Prisma, SubscriptionStatus } from '@prisma/client';
import { BaseRepository } from '../../../database/base.repository';
import { TransactionManager } from '../../../database/transaction-manager';

/** Locker + building + its ACTIVE subscriptions (enough to derive its status). */
export const lockerWithOccupancy = {
  building: { select: { id: true, code: true, name: true } },
  subscriptions: {
    where: { status: SubscriptionStatus.ACTIVE },
    include: { student: { select: { id: true, fullName: true, universityId: true, email: true } } },
    orderBy: { startDate: 'asc' },
  },
} satisfies Prisma.LockerInclude;

export type LockerWithOccupancy = Prisma.LockerGetPayload<{ include: typeof lockerWithOccupancy }>;

@Injectable()
export class LockerRepository extends BaseRepository {
  constructor(transactionManager: TransactionManager) {
    super(transactionManager);
  }

  findById(id: string): Promise<LockerWithOccupancy | null> {
    return this.db.locker.findUnique({ where: { id }, include: lockerWithOccupancy });
  }

  findByCode(code: string): Promise<Locker | null> {
    return this.db.locker.findUnique({ where: { code } });
  }

  async findPage(
    where: Prisma.LockerWhereInput,
    orderBy: Prisma.LockerOrderByWithRelationInput[],
    skip: number,
    take: number,
  ): Promise<[LockerWithOccupancy[], number]> {
    return Promise.all([
      this.db.locker.findMany({ where, include: lockerWithOccupancy, orderBy, skip, take }),
      this.db.locker.count({ where }),
    ]);
  }

  /** Every locker with its active subscriptions (for statistics). */
  findAllWithOccupancy(): Promise<LockerWithOccupancy[]> {
    return this.db.locker.findMany({ include: lockerWithOccupancy });
  }

  create(data: Prisma.LockerUncheckedCreateInput): Promise<Locker> {
    return this.db.locker.create({ data });
  }

  update(id: string, data: Prisma.LockerUncheckedUpdateInput): Promise<Locker> {
    return this.db.locker.update({ where: { id }, data });
  }
}
