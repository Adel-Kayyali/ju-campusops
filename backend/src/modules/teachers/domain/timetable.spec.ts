import { ScheduleEntryType, Weekday } from '@prisma/client';
import { BusinessRuleViolationException } from '../../../common/exceptions/domain.exceptions';
import { currentSlot, slotsOn, TimetableSlot, validateTimetable } from './timetable';

const slot = (weekday: Weekday, startTime: string, endTime: string, title = 'Slot', type: ScheduleEntryType = ScheduleEntryType.LECTURE): TimetableSlot => ({
  type,
  weekday,
  startTime,
  endTime,
  title,
});

describe('validateTimetable', () => {
  it('accepts back-to-back slots on the same day', () => {
    expect(() => validateTimetable([slot(Weekday.SUNDAY, '08:00', '09:30'), slot(Weekday.SUNDAY, '09:30', '11:00')])).not.toThrow();
  });

  it('rejects overlapping slots on the same day', () => {
    expect(() => validateTimetable([slot(Weekday.MONDAY, '10:00', '11:30', 'A'), slot(Weekday.MONDAY, '11:00', '12:00', 'B')])).toThrow(BusinessRuleViolationException);
  });

  it('allows the same hours on different days', () => {
    expect(() => validateTimetable([slot(Weekday.MONDAY, '10:00', '11:30'), slot(Weekday.TUESDAY, '10:00', '11:30')])).not.toThrow();
  });

  it('rejects a slot that ends before it starts, or invalid times', () => {
    expect(() => validateTimetable([slot(Weekday.SUNDAY, '12:00', '11:00')])).toThrow(BusinessRuleViolationException);
    expect(() => validateTimetable([slot(Weekday.SUNDAY, '25:00', '26:00')])).toThrow(BusinessRuleViolationException);
  });
});

describe('currentSlot / slotsOn', () => {
  const week = [
    slot(Weekday.SUNDAY, '11:00', '12:00', 'Office hours', ScheduleEntryType.OFFICE_HOUR),
    slot(Weekday.SUNDAY, '08:00', '09:30', 'Software Engineering'),
    slot(Weekday.MONDAY, '08:00', '09:30', 'Databases'),
  ];

  it('finds the slot in progress (start inclusive, end exclusive)', () => {
    expect(currentSlot(week, Weekday.SUNDAY, 8 * 60)?.title).toBe('Software Engineering');
    expect(currentSlot(week, Weekday.SUNDAY, 9 * 60 + 30)).toBeNull();
    expect(currentSlot(week, Weekday.SUNDAY, 11 * 60 + 15)?.type).toBe(ScheduleEntryType.OFFICE_HOUR);
  });

  it('lists the slots of one day in time order', () => {
    expect(slotsOn(week, Weekday.SUNDAY).map((s) => s.startTime)).toEqual(['08:00', '11:00']);
  });
});
