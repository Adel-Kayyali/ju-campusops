import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

/** "2026-11-07" or ISO date-time -> "07 Nov 2026". */
export function formatDate(value: string | Date | null | undefined): string {
  return value ? dayjs(value).format('DD MMM YYYY') : '—';
}

export function formatDateTime(value: string | Date | null | undefined): string {
  return value ? dayjs(value).format('DD MMM YYYY, HH:mm') : '—';
}

/** "3 hours ago", "in 2 days". */
export function formatRelative(value: string | Date | null | undefined): string {
  return value ? dayjs(value).fromNow() : '—';
}

/** Amounts are in Jordanian Dinars. */
export function formatMoney(amount: number | null | undefined): string {
  return `${(amount ?? 0).toFixed(2)} JOD`;
}

export function formatNumber(value: number | null | undefined, suffix = ''): string {
  return value === null || value === undefined ? '—' : `${value}${suffix}`;
}

/** Date -> "YYYY-MM-DD" (local calendar date, as expected by the API). */
export function toDateOnly(date: Date | string): string {
  return dayjs(date).format('YYYY-MM-DD');
}

export function todayDateOnly(): string {
  return dayjs().format('YYYY-MM-DD');
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
