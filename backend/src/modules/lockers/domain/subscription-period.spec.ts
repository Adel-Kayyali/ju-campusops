import { BusinessRuleViolationException } from '../../../common/exceptions/domain.exceptions';
import { DateOnly } from '../../../common/utils/date-only';
import { quotePrice } from './locker-pricing';
import { SubscriptionPeriod } from './subscription-period';

const d = DateOnly.parse;

describe('SubscriptionPeriod', () => {
  it.each([
    [1, '2026-12-06'],
    [2, '2027-01-06'],
    [3, '2027-02-06'],
    [4, '2027-03-06'],
  ])('a %i-month preset from 2026-11-07 ends on %s', (months, expectedEnd) => {
    const period = SubscriptionPeriod.ofMonths(d('2026-11-07'), months);
    expect(DateOnly.format(period.end)).toBe(expectedEnd);
    expect(period.billableMonths).toBe(months);
  });

  it('clamps month ends (31 Jan + 1 month ends on 27 Feb in a non-leap year)', () => {
    expect(DateOnly.format(SubscriptionPeriod.ofMonths(d('2027-01-31'), 1).end)).toBe('2027-02-27');
  });

  it('charges every started month in a custom range', () => {
    expect(SubscriptionPeriod.ofRange(d('2026-11-07'), d('2026-11-20')).billableMonths).toBe(1);
    expect(SubscriptionPeriod.ofRange(d('2026-11-07'), d('2026-12-06')).billableMonths).toBe(1);
    expect(SubscriptionPeriod.ofRange(d('2026-11-07'), d('2026-12-07')).billableMonths).toBe(2);
  });

  it('rejects an end date before the start date', () => {
    expect(() => SubscriptionPeriod.ofRange(d('2026-11-07'), d('2026-11-06'))).toThrow(BusinessRuleViolationException);
  });

  it('rejects durations outside 1..12 months', () => {
    expect(() => SubscriptionPeriod.ofMonths(d('2026-11-07'), 0)).toThrow(BusinessRuleViolationException);
    expect(() => SubscriptionPeriod.ofMonths(d('2026-11-07'), 13)).toThrow(BusinessRuleViolationException);
  });

  it('detects overlapping periods (inclusive bounds)', () => {
    const period = SubscriptionPeriod.ofRange(d('2026-11-01'), d('2026-11-30'));
    expect(period.overlaps({ start: d('2026-11-30'), end: d('2026-12-10') })).toBe(true);
    expect(period.overlaps({ start: d('2026-12-01'), end: d('2026-12-10') })).toBe(false);
  });

  it('quotes monthly fee x billable months', () => {
    expect(quotePrice(7.5, SubscriptionPeriod.ofMonths(d('2026-11-07'), 3))).toEqual({ billableMonths: 3, monthlyFee: 7.5, amount: 22.5 });
  });
});
