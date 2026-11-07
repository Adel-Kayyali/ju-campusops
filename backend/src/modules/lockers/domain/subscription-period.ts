import { BusinessRuleViolationException } from '../../../common/exceptions/domain.exceptions';
import { DateOnly } from '../../../common/utils/date-only';
import { LockerRules } from './locker-rules';

/**
 * Value object: an inclusive range of calendar days [start, end] that a locker is rented for.
 * Immutable and self-validating.
 */
export class SubscriptionPeriod {
  private constructor(
    readonly start: Date,
    readonly end: Date,
  ) {}

  /** A preset duration: "1 month from 7 Nov" = 7 Nov .. 6 Dec (inclusive). */
  static ofMonths(start: Date, months: number): SubscriptionPeriod {
    if (!Number.isInteger(months) || months < 1 || months > LockerRules.MAX_SUBSCRIPTION_MONTHS) {
      throw new BusinessRuleViolationException(
        `Duration must be between 1 and ${LockerRules.MAX_SUBSCRIPTION_MONTHS} months`,
        'INVALID_DURATION',
      );
    }
    return new SubscriptionPeriod(start, DateOnly.addDays(DateOnly.addMonths(start, months), -1));
  }

  /** A custom "from - to" range chosen in the date picker. */
  static ofRange(start: Date, end: Date): SubscriptionPeriod {
    if (end < start) {
      throw new BusinessRuleViolationException('The end date must be on or after the start date', 'INVALID_PERIOD');
    }
    const period = new SubscriptionPeriod(start, end);
    if (period.billableMonths > LockerRules.MAX_SUBSCRIPTION_MONTHS) {
      throw new BusinessRuleViolationException(
        `A subscription cannot be longer than ${LockerRules.MAX_SUBSCRIPTION_MONTHS} months`,
        'PERIOD_TOO_LONG',
      );
    }
    return period;
  }

  get days(): number {
    return DateOnly.inclusiveDays(this.start, this.end);
  }

  /**
   * Number of months that are charged: every started month counts as a full month.
   * 7 Nov..6 Dec = 1 month, 7 Nov..7 Dec = 2 months.
   */
  get billableMonths(): number {
    let months = 0;
    while (DateOnly.addMonths(this.start, months) <= this.end) {
      months++;
    }
    return months;
  }

  overlaps(other: { start: Date; end: Date }): boolean {
    return this.start <= other.end && other.start <= this.end;
  }

  contains(day: Date): boolean {
    return this.start <= day && day <= this.end;
  }

  toJSON(): { startDate: string; endDate: string } {
    return { startDate: DateOnly.format(this.start), endDate: DateOnly.format(this.end) };
  }
}
