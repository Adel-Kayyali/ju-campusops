import { Prisma, SubscriptionStatus } from '@prisma/client';
import { DateOnly } from '../../../common/utils/date-only';
import { LockerRules } from '../domain/locker-rules';
import { LockerStatus } from '../domain/locker-status';

/**
 * Translates the (derived) locker statuses into SQL conditions, so the database can
 * filter and paginate (similar to Spring Data JPA Specifications).
 * Must stay consistent with deriveLockerStatus().
 */
export class LockerSpecifications {
  static hasStatus(status: LockerStatus, today: Date): Prisma.LockerWhereInput {
    const active = { status: SubscriptionStatus.ACTIVE };
    const coversToday = { ...active, startDate: { lte: today }, endDate: { gte: today } };
    const inService: Prisma.LockerWhereInput = { isOutOfService: false };

    switch (status) {
      case LockerStatus.OUT_OF_SERVICE:
        return { isOutOfService: true };
      case LockerStatus.OCCUPIED:
        return {
          ...inService,
          subscriptions: { some: { ...coversToday, endDate: { gte: DateOnly.addDays(today, LockerRules.EXPIRING_SOON_DAYS) } } },
        };
      case LockerStatus.EXPIRING_SOON:
        return {
          ...inService,
          subscriptions: { some: { ...coversToday, endDate: { gte: today, lt: DateOnly.addDays(today, LockerRules.EXPIRING_SOON_DAYS) } } },
        };
      case LockerStatus.EXPIRED:
        return {
          ...inService,
          AND: [{ subscriptions: { none: coversToday } }, { subscriptions: { some: { ...active, endDate: { lt: today } } } }],
        };
      case LockerStatus.RESERVED:
        return {
          ...inService,
          AND: [
            { subscriptions: { none: { ...active, startDate: { lte: today } } } },
            { subscriptions: { some: { ...active, startDate: { gt: today } } } },
          ],
        };
      case LockerStatus.AVAILABLE:
        return { ...inService, subscriptions: { none: active } };
    }
  }

  static heldByStudent(search: string): Prisma.LockerWhereInput {
    return {
      subscriptions: {
        some: {
          status: SubscriptionStatus.ACTIVE,
          student: {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' } },
              { universityId: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      },
    };
  }

  static subscriptionEndsBetween(from?: Date, to?: Date): Prisma.LockerWhereInput {
    return { subscriptions: { some: { status: SubscriptionStatus.ACTIVE, endDate: { gte: from, lte: to } } } };
  }
}
