import { average, percentage, weekStart, weekStartsBetween } from './report-calculations';

describe('report calculations', () => {
  it('averages with one decimal, null when empty', () => {
    expect(average([1, 2, 4])).toBe(2.3);
    expect(average([])).toBeNull();
  });

  it('computes percentages', () => {
    expect(percentage(1, 3)).toBe(33.3);
    expect(percentage(1, 0)).toBeNull();
  });

  it('finds the Monday of a week', () => {
    expect(weekStart(new Date('2026-11-07T10:00:00Z'))).toBe('2026-11-02');
    expect(weekStart(new Date('2026-11-02T00:00:00Z'))).toBe('2026-11-02');
  });

  it('lists the weeks of a period', () => {
    expect(weekStartsBetween(new Date('2026-10-20T00:00:00Z'), new Date('2026-11-07T00:00:00Z'))).toEqual(['2026-10-19', '2026-10-26', '2026-11-02']);
  });
});
