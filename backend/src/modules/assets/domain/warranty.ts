import { DateOnly } from '../../../common/utils/date-only';

export enum WarrantyStatus {
  NONE = 'NONE',
  ACTIVE = 'ACTIVE',
  EXPIRING_SOON = 'EXPIRING_SOON',
  EXPIRED = 'EXPIRED',
}

/** Warranties ending within this many days are highlighted. */
export const WARRANTY_WARNING_DAYS = 60;

export function warrantyStatus(warrantyExpiry: Date | null, today: Date): WarrantyStatus {
  if (!warrantyExpiry) return WarrantyStatus.NONE;
  const daysLeft = DateOnly.daysBetween(today, warrantyExpiry);
  if (daysLeft < 0) return WarrantyStatus.EXPIRED;
  return daysLeft <= WARRANTY_WARNING_DAYS ? WarrantyStatus.EXPIRING_SOON : WarrantyStatus.ACTIVE;
}
