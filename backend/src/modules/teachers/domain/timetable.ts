import { ScheduleEntryType, Weekday } from '@prisma/client';
import { BusinessRuleViolationException } from '../../../common/exceptions/domain.exceptions';

/** "HH:MM", 24-hour clock. */
export const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Weekdays in calendar order; index = JavaScript's Date.getDay() (0 = Sunday). */
export const WEEK: readonly Weekday[] = [
  Weekday.SUNDAY,
  Weekday.MONDAY,
  Weekday.TUESDAY,
  Weekday.WEDNESDAY,
  Weekday.THURSDAY,
  Weekday.FRIDAY,
  Weekday.SATURDAY,
];

export const MAX_SCHEDULE_ENTRIES = 60;

export interface TimetableSlot {
  type: ScheduleEntryType;
  weekday: Weekday;
  startTime: string;
  endTime: string;
  title: string;
  location?: string | null;
}

export function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Validates a whole weekly timetable: valid times, start before end, and no two slots
 * of the same day overlapping (a teacher cannot be in two places at once).
 */
export function validateTimetable(slots: readonly TimetableSlot[]): void {
  if (slots.length > MAX_SCHEDULE_ENTRIES) {
    throw new BusinessRuleViolationException(`A timetable can have at most ${MAX_SCHEDULE_ENTRIES} entries`, 'TIMETABLE_TOO_LARGE');
  }
  for (const slot of slots) {
    if (!TIME_PATTERN.test(slot.startTime) || !TIME_PATTERN.test(slot.endTime)) {
      throw new BusinessRuleViolationException(`Invalid time in "${slot.title}". Use HH:MM`, 'INVALID_TIME');
    }
    if (toMinutes(slot.startTime) >= toMinutes(slot.endTime)) {
      throw new BusinessRuleViolationException(`"${slot.title}" on ${label(slot.weekday)} must end after it starts`, 'INVALID_TIME_RANGE');
    }
  }
  for (const day of WEEK) {
    const sameDay = sortByTime(slots.filter((slot) => slot.weekday === day));
    for (let i = 1; i < sameDay.length; i++) {
      const previous = sameDay[i - 1];
      const current = sameDay[i];
      if (toMinutes(current.startTime) < toMinutes(previous.endTime)) {
        throw new BusinessRuleViolationException(
          `On ${label(day)}, "${current.title}" (${current.startTime}) overlaps "${previous.title}" (${previous.startTime}–${previous.endTime})`,
          'TIMETABLE_OVERLAP',
        );
      }
    }
  }
}

export function sortByTime<T extends Pick<TimetableSlot, 'weekday' | 'startTime'>>(slots: readonly T[]): T[] {
  return [...slots].sort((a, b) => WEEK.indexOf(a.weekday) - WEEK.indexOf(b.weekday) || toMinutes(a.startTime) - toMinutes(b.startTime));
}

/** The slots of one day, in time order. */
export function slotsOn<T extends TimetableSlot>(slots: readonly T[], weekday: Weekday): T[] {
  return sortByTime(slots.filter((slot) => slot.weekday === weekday));
}

/** The slot happening at the given moment (start inclusive, end exclusive), if any. */
export function currentSlot<T extends TimetableSlot>(slots: readonly T[], weekday: Weekday, minutesOfDay: number): T | null {
  return slotsOn(slots, weekday).find((slot) => toMinutes(slot.startTime) <= minutesOfDay && minutesOfDay < toMinutes(slot.endTime)) ?? null;
}

function label(day: Weekday): string {
  return day.charAt(0) + day.slice(1).toLowerCase();
}
