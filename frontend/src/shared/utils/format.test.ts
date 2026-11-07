import { describe, expect, it } from 'vitest';
import { enumLabel, statusColor } from './labels';
import { formatMoney, toDateOnly } from './format';

describe('labels', () => {
  it('turns enum values into readable labels', () => {
    expect(enumLabel('IN_PROGRESS')).toBe('In progress');
    expect(enumLabel('IT_NETWORK')).toBe('IT & network');
    expect(enumLabel('P1')).toBe('P1');
  });

  it('has a colour for every locker status', () => {
    for (const status of ['AVAILABLE', 'OCCUPIED', 'EXPIRING_SOON', 'EXPIRED', 'RESERVED', 'OUT_OF_SERVICE']) {
      expect(statusColor(status)).not.toBe('gray');
    }
  });
});

describe('format', () => {
  it('formats money in JOD with 2 decimals', () => {
    expect(formatMoney(7.5)).toBe('7.50 JOD');
  });

  it('converts dates to YYYY-MM-DD', () => {
    expect(toDateOnly(new Date(2026, 10, 7))).toBe('2026-11-07');
  });
});
