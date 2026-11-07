import { IntervalUnit } from '@prisma/client';
import { DateOnly } from '../../../common/utils/date-only';

/** Pure date rules of recurring (preventive) maintenance. */
export class ScheduleCalculator {
  static advance(from: Date, value: number, unit: IntervalUnit): Date {
    switch (unit) {
      case IntervalUnit.DAYS:
        return DateOnly.addDays(from, value);
      case IntervalUnit.WEEKS:
        return DateOnly.addDays(from, value * 7);
      case IntervalUnit.MONTHS:
        return DateOnly.addMonths(from, value);
    }
  }

  /** Planned work is generated `leadDays` before the due date, so it is ready in time. */
  static isDueForGeneration(nextDueDate: Date, leadDays: number, today: Date): boolean {
    return DateOnly.addDays(nextDueDate, -leadDays) <= today;
  }

  /** Next due date strictly after `today` (missed cycles are skipped, not piled up). */
  static nextAfter(current: Date, value: number, unit: IntervalUnit, today: Date): Date {
    let next = ScheduleCalculator.advance(current, value, unit);
    while (next <= today) {
      next = ScheduleCalculator.advance(next, value, unit);
    }
    return next;
  }
}
