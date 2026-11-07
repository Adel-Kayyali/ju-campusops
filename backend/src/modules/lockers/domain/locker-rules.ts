/** Business constants of the locker module (single place to tune them). */
export const LockerRules = {
  /** A subscription that ends within this many days is shown as "expiring soon". */
  EXPIRING_SOON_DAYS: 7,
  /** Quick-pick durations offered in the "start subscription" dialog. */
  PRESET_DURATIONS_MONTHS: [1, 2, 3, 4] as const,
  /** Longest single subscription (or extension) that can be sold. */
  MAX_SUBSCRIPTION_MONTHS: 12,
  /** How far in the past a subscription may start (to register cash already received). */
  MAX_BACKDATE_DAYS: 30,
  /** How far in the future a subscription may start (reservations). */
  MAX_ADVANCE_DAYS: 180,
} as const;
