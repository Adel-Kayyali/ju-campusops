import { DateOnly } from '../../../common/utils/date-only';
import { daysRemaining, deriveLockerStatus, deriveSubscriptionState, LockerStatus, SubscriptionState } from './locker-status';

const d = DateOnly.parse;
const today = d('2026-11-07');
const sub = (start: string, end: string) => ({ startDate: d(start), endDate: d(end) });

describe('deriveLockerStatus', () => {
  it('is AVAILABLE without active subscriptions', () => {
    expect(deriveLockerStatus(false, [], today).status).toBe(LockerStatus.AVAILABLE);
  });

  it('is OCCUPIED when a subscription covers today', () => {
    const result = deriveLockerStatus(false, [sub('2026-11-01', '2026-12-31')], today);
    expect(result.status).toBe(LockerStatus.OCCUPIED);
    expect(result.subscription).not.toBeNull();
  });

  it('is EXPIRING_SOON when the subscription ends within 7 days', () => {
    expect(deriveLockerStatus(false, [sub('2026-10-10', '2026-11-12')], today).status).toBe(LockerStatus.EXPIRING_SOON);
  });

  it('is EXPIRED when the period is over but the locker was not released', () => {
    expect(deriveLockerStatus(false, [sub('2026-09-01', '2026-11-01')], today).status).toBe(LockerStatus.EXPIRED);
  });

  it('is RESERVED when only a future subscription exists', () => {
    expect(deriveLockerStatus(false, [sub('2026-12-01', '2026-12-31')], today).status).toBe(LockerStatus.RESERVED);
  });

  it('prefers the current subscription over an upcoming one', () => {
    const result = deriveLockerStatus(false, [sub('2026-12-01', '2026-12-31'), sub('2026-11-01', '2026-11-30')], today);
    expect(result.status).toBe(LockerStatus.OCCUPIED);
    expect(DateOnly.format(result.subscription!.endDate)).toBe('2026-11-30');
  });

  it('is OUT_OF_SERVICE whatever the subscriptions', () => {
    expect(deriveLockerStatus(true, [sub('2026-11-01', '2026-12-31')], today).status).toBe(LockerStatus.OUT_OF_SERVICE);
  });
});

describe('deriveSubscriptionState', () => {
  it('maps stored and date-based states', () => {
    expect(deriveSubscriptionState({ ...sub('2026-12-01', '2026-12-31'), status: 'ACTIVE' }, today)).toBe(SubscriptionState.UPCOMING);
    expect(deriveSubscriptionState({ ...sub('2026-11-01', '2026-12-31'), status: 'ACTIVE' }, today)).toBe(SubscriptionState.ACTIVE);
    expect(deriveSubscriptionState({ ...sub('2026-11-01', '2026-11-10'), status: 'ACTIVE' }, today)).toBe(SubscriptionState.EXPIRING_SOON);
    expect(deriveSubscriptionState({ ...sub('2026-10-01', '2026-11-01'), status: 'ACTIVE' }, today)).toBe(SubscriptionState.EXPIRED);
    expect(deriveSubscriptionState({ ...sub('2026-10-01', '2026-11-01'), status: 'ENDED' }, today)).toBe(SubscriptionState.ENDED);
  });

  it('counts remaining days including today', () => {
    expect(daysRemaining(d('2026-11-07'), today)).toBe(1);
    expect(daysRemaining(d('2026-11-10'), today)).toBe(4);
    expect(daysRemaining(d('2026-11-01'), today)).toBe(0);
  });
});
