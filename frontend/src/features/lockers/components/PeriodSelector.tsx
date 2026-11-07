import { SegmentedControl, Select, SimpleGrid, Stack } from '@mantine/core';
import { DateInput, DatePickerInput } from '@mantine/dates';
import { PRESET_DURATIONS } from '../types';

export type PeriodMode = 'preset' | 'custom';

export interface PeriodValue {
  mode: PeriodMode;
  startDate: string | null;
  months: number | null;
  range: [string | null, string | null];
}

/** Converts the selector state into the API's period fields (or null when incomplete). */
export function toPeriodInput(value: PeriodValue): { startDate: string; durationMonths?: number; endDate?: string } | null {
  if (value.mode === 'preset') {
    return value.startDate && value.months ? { startDate: value.startDate, durationMonths: value.months } : null;
  }
  const [start, end] = value.range;
  return start && end ? { startDate: start, endDate: end } : null;
}

/**
 * Two ways to choose the period: a quick duration (1-4 months from a start date)
 * or any custom from-to range picked on the calendar.
 */
export function PeriodSelector({ value, onChange }: { value: PeriodValue; onChange: (value: PeriodValue) => void }) {
  return (
    <Stack gap="sm">
      <SegmentedControl
        fullWidth
        value={value.mode}
        onChange={(mode) => onChange({ ...value, mode: mode as PeriodMode })}
        data={[
          { value: 'preset', label: 'Quick duration' },
          { value: 'custom', label: 'Custom dates (from – to)' },
        ]}
      />
      {value.mode === 'preset' ? (
        <SimpleGrid cols={2}>
          <DateInput label="Start date" valueFormat="DD MMM YYYY" value={value.startDate} onChange={(startDate) => onChange({ ...value, startDate })} required />
          <Select
            label="Duration"
            required
            allowDeselect={false}
            data={PRESET_DURATIONS.map((m) => ({ value: String(m), label: `${m} month${m > 1 ? 's' : ''}` }))}
            value={value.months ? String(value.months) : null}
            onChange={(months) => onChange({ ...value, months: months ? Number(months) : null })}
          />
        </SimpleGrid>
      ) : (
        <DatePickerInput type="range" label="From – to" placeholder="Pick the first and last day" valueFormat="DD MMM YYYY" required value={value.range} onChange={(range) => onChange({ ...value, range: range as [string | null, string | null] })} />
      )}
    </Stack>
  );
}
