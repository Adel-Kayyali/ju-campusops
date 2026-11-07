import { Injectable } from '@nestjs/common';
import { LockerSubscription, Prisma, SubscriptionStatus } from '@prisma/client';
import { BaseRepository } from '../../../database/base.repository';
import { TransactionManager } from '../../../database/transaction-manager';

export const subscriptionDetails = {
  locker: { include: { building: { select: { id: true, code: true, name: true } } } },
  student: { select: { id: true, fullName: true, universityId: true, email: true } },
  createdBy: { select: { fullName: true } },
  endedBy: { select: { fullName: true } },
  payments: { include: { receivedBy: { select: { fullName: true } } }, orderBy: { receivedAt: 'asc' } },
} satisfies Prisma.LockerSubscriptionInclude;

export type SubscriptionWithDetails = Prisma.LockerSubscriptionGetPayload<{ include: typeof subscriptionDetails }>;

@Injectable()
export class LockerSubscriptionRepository extends BaseRepository {
  constructor(transactionManager: TransactionManager) {
    super(transactionManager);
  }

  findById(id: string): Promise<SubscriptionWithDetails | null> {
    return this.db.lockerSubscription.findUnique({ where: { id }, include: subscriptionDetails });
  }

  /** First ACTIVE subscription of the locker overlapping [start, end] (both inclusive). */
  findOverlapping(lockerId: string, start: Date, end: Date, excludeId?: string): Promise<LockerSubscription | null> {
    return this.db.lockerSubscription.findFirst({
      where: {
        lockerId,
        status: SubscriptionStatus.ACTIVE,
        id: excludeId ? { not: excludeId } : undefined,
        startDate: { lte: end },
        endDate: { gte: start },
      },
      orderBy: { startDate: 'asc' },
    });
  }

  async findPage(
    where: Prisma.LockerSubscriptionWhereInput,
    orderBy: Prisma.LockerSubscriptionOrderByWithRelationInput,
    skip: number,
    take: number,
  ): Promise<[SubscriptionWithDetails[], number]> {
    return Promise.all([
      this.db.lockerSubscription.findMany({ where, include: subscriptionDetails, orderBy, skip, take }),
      this.db.lockerSubscription.count({ where }),
    ]);
  }

  findAll(where: Prisma.LockerSubscriptionWhereInput, orderBy: Prisma.LockerSubscriptionOrderByWithRelationInput): Promise<SubscriptionWithDetails[]> {
    return this.db.lockerSubscription.findMany({ where, include: subscriptionDetails, orderBy });
  }

  create(data: Prisma.LockerSubscriptionUncheckedCreateInput): Promise<LockerSubscription> {
    return this.db.lockerSubscription.create({ data });
  }

  update(id: string, data: Prisma.LockerSubscriptionUncheckedUpdateInput): Promise<LockerSubscription> {
    return this.db.lockerSubscription.update({ where: { id }, data });
  }

  countActiveCoveringToday(today: Date): Promise<number> {
    return this.db.lockerSubscription.count({
      where: { status: SubscriptionStatus.ACTIVE, startDate: { lte: today }, endDate: { gte: today } },
    });
  }

  /** ACTIVE subscriptions whose last day is exactly the given date (for reminders). */
  findEndingOn(date: Date): Promise<SubscriptionWithDetails[]> {
    return this.findAll({ status: SubscriptionStatus.ACTIVE, endDate: date }, { endDate: 'asc' });
  }
}
