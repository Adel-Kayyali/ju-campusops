/**
 * Helpers for calendar dates without a time component ("2026-11-07").
 * Calendar dates are stored as PostgreSQL DATE columns, which Prisma returns
 * as a JS Date at 00:00 UTC. All maths here is done in UTC (no DST surprises).
 */
const MS_PER_DAY = 86_400_000;

export const DateOnly = {
  /** Parses "YYYY-MM-DD" into a Date at 00:00 UTC. */
  parse(value: string): Date {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) {
      throw new Error(`Invalid date "${value}", expected YYYY-MM-DD`);
    }
    return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  },

  /** Formats a Date as "YYYY-MM-DD" (UTC). */
  format(date: Date): string {
    return date.toISOString().slice(0, 10);
  },

  /** Today's calendar date in the given IANA time zone (default: campus time zone). */
  today(timeZone = 'Asia/Amman', now: Date = new Date()): Date {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
    return DateOnly.parse(parts);
  },

  addDays(date: Date, days: number): Date {
    return new Date(date.getTime() + days * MS_PER_DAY);
  },

  /** Adds calendar months; the day is clamped to the last day of the target month (Jan 31 + 1 month = Feb 28/29). */
  addMonths(date: Date, months: number): Date {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + months;
    const lastDayOfTarget = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    return new Date(Date.UTC(year, month, Math.min(date.getUTCDate(), lastDayOfTarget)));
  },

  /** Number of calendar days from `from` to `to` (negative when `to` is earlier). */
  daysBetween(from: Date, to: Date): number {
    return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY);
  },

  /** Number of days in [start, end], both inclusive. */
  inclusiveDays(start: Date, end: Date): number {
    return DateOnly.daysBetween(start, end) + 1;
  },
};
