import { IntervalUnit } from '@prisma/client';
import { DateOnly } from '../../../common/utils/date-only';
import { ScheduleCalculator } from './schedule-calculator';

const d = DateOnly.parse;

describe('ScheduleCalculator', () => {
  it('advances by days, weeks and months', () => {
    expect(DateOnly.format(ScheduleCalculator.advance(d('2026-11-07'), 10, IntervalUnit.DAYS))).toBe('2026-11-17');
    expect(DateOnly.format(ScheduleCalculator.advance(d('2026-11-07'), 2, IntervalUnit.WEEKS))).toBe('2026-11-21');
    expect(DateOnly.format(ScheduleCalculator.advance(d('2026-11-07'), 3, IntervalUnit.MONTHS))).toBe('2027-02-07');
  });

  it('generates work lead-days before the due date', () => {
    expect(ScheduleCalculator.isDueForGeneration(d('2026-11-14'), 7, d('2026-11-07'))).toBe(true);
    expect(ScheduleCalculator.isDueForGeneration(d('2026-11-15'), 7, d('2026-11-07'))).toBe(false);
  });

  it('skips missed cycles when computing the next due date', () => {
    expect(DateOnly.format(ScheduleCalculator.nextAfter(d('2026-08-01'), 1, IntervalUnit.MONTHS, d('2026-11-07')))).toBe('2026-12-01');
  });
});
