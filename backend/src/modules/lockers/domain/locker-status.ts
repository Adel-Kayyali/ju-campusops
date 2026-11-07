import { DateOnly } from '../../../common/utils/date-only';
import { LockerRules } from './locker-rules';

/** Status of a locker as displayed to the administrator. It is derived, never stored. */
export enum LockerStatus {
  /** Free, can be rented now. */
  AVAILABLE = 'AVAILABLE',
  /** Free today, but a subscription starts in the future. */
  RESERVED = 'RESERVED',
  /** Rented by a student. */
  OCCUPIED = 'OCCUPIED',
  /** Rented, and the subscription ends within EXPIRING_SOON_DAYS. */
  EXPIRING_SOON = 'EXPIRING_SOON',
  /** The subscription ended but the administrator has not released the locker yet. */
  EXPIRED = 'EXPIRED',
  /** Broken / under maintenance. */
  OUT_OF_SERVICE = 'OUT_OF_SERVICE',
}

/** Status of a single subscription, from the student's point of view. */
export enum SubscriptionState {
  UPCOMING = 'UPCOMING',
  ACTIVE = 'ACTIVE',
  EXPIRING_SOON = 'EXPIRING_SOON',
  EXPIRED = 'EXPIRED',
  ENDED = 'ENDED',
  CANCELLED = 'CANCELLED',
}

export interface PeriodLike {
  startDate: Date;
  endDate: Date;
}

export interface LockerStatusResult<S extends PeriodLike> {
  status: LockerStatus;
  /** The subscription that explains the status (current, expired or upcoming), if any. */
  subscription: S | null;
}

/**
 * Derives the locker status from its ACTIVE subscriptions and today's date.
 * Precedence: out of service > occupied/expiring > expired (not released) > reserved > available.
 */
export function deriveLockerStatus<S extends PeriodLike>(
  isOutOfService: boolean,
  activeSubscriptions: readonly S[],
  today: Date,
): LockerStatusResult<S> {
  const current = activeSubscriptions.find((s) => s.startDate <= today && today <= s.endDate) ?? null;
  const expired = latest(activeSubscriptions.filter((s) => s.endDate < today));
  const upcoming = earliest(activeSubscriptions.filter((s) => s.startDate > today));

  if (isOutOfService) {
    return { status: LockerStatus.OUT_OF_SERVICE, subscription: current ?? expired ?? upcoming };
  }
  if (current) {
    const daysLeft = DateOnly.daysBetween(today, current.endDate);
    return { status: daysLeft < LockerRules.EXPIRING_SOON_DAYS ? LockerStatus.EXPIRING_SOON : LockerStatus.OCCUPIED, subscription: current };
  }
  if (expired) {
    return { status: LockerStatus.EXPIRED, subscription: expired };
  }
  if (upcoming) {
    return { status: LockerStatus.RESERVED, subscription: upcoming };
  }
  return { status: LockerStatus.AVAILABLE, subscription: null };
}

/** Derives the display state of one subscription. */
export function deriveSubscriptionState(
  subscription: PeriodLike & { status: 'ACTIVE' | 'ENDED' | 'CANCELLED' },
  today: Date,
): SubscriptionState {
  if (subscription.status === 'ENDED') return SubscriptionState.ENDED;
  if (subscription.status === 'CANCELLED') return SubscriptionState.CANCELLED;
  if (subscription.startDate > today) return SubscriptionState.UPCOMING;
  if (subscription.endDate < today) return SubscriptionState.EXPIRED;
  return DateOnly.daysBetween(today, subscription.endDate) < LockerRules.EXPIRING_SOON_DAYS
    ? SubscriptionState.EXPIRING_SOON
    : SubscriptionState.ACTIVE;
}

/** Days left including today (0 when already over). */
export function daysRemaining(endDate: Date, today: Date): number {
  return Math.max(0, DateOnly.daysBetween(today, endDate) + 1);
}

function latest<S extends PeriodLike>(items: S[]): S | null {
  return items.reduce<S | null>((best, s) => (!best || s.endDate > best.endDate ? s : best), null);
}

function earliest<S extends PeriodLike>(items: S[]): S | null {
  return items.reduce<S | null>((best, s) => (!best || s.startDate < best.startDate ? s : best), null);
}
