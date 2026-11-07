import { Priority, Severity, Urgency } from '@prisma/client';
import { calculatePriority, higherOf } from './priority-matrix';

describe('calculatePriority', () => {
  it.each([
    [Severity.CRITICAL, Urgency.HIGH, Priority.P1],
    [Severity.CRITICAL, Urgency.LOW, Priority.P2],
    [Severity.HIGH, Urgency.MEDIUM, Priority.P2],
    [Severity.MEDIUM, Urgency.MEDIUM, Priority.P3],
    [Severity.LOW, Urgency.LOW, Priority.P4],
  ])('%s impact with %s urgency is %s', (severity, urgency, expected) => {
    expect(calculatePriority(severity, urgency, false)).toBe(expected);
  });

  it('raises safety-related requests to at least P2', () => {
    expect(calculatePriority(Severity.LOW, Urgency.LOW, true)).toBe(Priority.P2);
  });

  it('keeps P1 for safety-related critical requests', () => {
    expect(calculatePriority(Severity.CRITICAL, Urgency.HIGH, true)).toBe(Priority.P1);
  });

  it('higherOf returns the most urgent priority', () => {
    expect(higherOf(Priority.P3, Priority.P1)).toBe(Priority.P1);
    expect(higherOf(Priority.P2, Priority.P4)).toBe(Priority.P2);
  });
});
