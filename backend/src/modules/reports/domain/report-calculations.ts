/** Pure helpers used to build the performance reports (easy to unit test). */

const HOUR_MS = 3_600_000;

export function hoursBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / HOUR_MS;
}

export function average(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 10) / 10;
}

export function percentage(part: number, total: number): number | null {
  return total === 0 ? null : Math.round((part / total) * 1000) / 10;
}

/** Groups items by a key and maps each group to a value. */
export function groupBy<T, K extends string>(items: readonly T[], key: (item: T) => K): Map<K, T[]> {
  const groups = new Map<K, T[]>();
  for (const item of items) {
    const k = key(item);
    groups.set(k, [...(groups.get(k) ?? []), item]);
  }
  return groups;
}

/** Monday (UTC) of the week containing `date`, formatted YYYY-MM-DD. */
export function weekStart(date: Date): string {
  const day = date.getUTCDay();
  const diff = (day + 6) % 7;
  const monday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - diff));
  return monday.toISOString().slice(0, 10);
}

/** Consecutive week starts covering [from, to]. */
export function weekStartsBetween(from: Date, to: Date): string[] {
  const weeks: string[] = [];
  let cursor = new Date(`${weekStart(from)}T00:00:00Z`);
  while (cursor <= to) {
    weeks.push(cursor.toISOString().slice(0, 10));
    cursor = new Date(cursor.getTime() + 7 * 24 * HOUR_MS);
  }
  return weeks;
}
