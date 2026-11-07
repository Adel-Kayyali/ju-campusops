import { Button, Group, NumberInput, Paper, Select, SimpleGrid, TextInput } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { IconFilterOff, IconSearch } from '@tabler/icons-react';
import { buildingOptions, useBuildings } from '@/features/locations/api';
import { LOCKER_SIZES, LOCKER_STATUSES, type LockerSize, type LockerStatus } from '@/shared/types/enums';
import { toOptions } from '@/shared/utils/labels';
import type { LockerQuery } from '../types';

export type LockerFilterValues = Pick<LockerQuery, 'code' | 'student' | 'buildingId' | 'floor' | 'zone' | 'lockerSize' | 'status' | 'endsFrom' | 'endsTo'>;

interface LockerFiltersProps {
  value: LockerFilterValues;
  onChange: (value: LockerFilterValues) => void;
}

/** Every filter of the lockers screen. Text filters are debounced by the page. */
export function LockerFilters({ value, onChange }: LockerFiltersProps) {
  const buildings = useBuildings();
  const set = <K extends keyof LockerFilterValues>(key: K, v: LockerFilterValues[K]) => onChange({ ...value, [key]: v || undefined });
  const hasFilters = Object.values(value).some((v) => v !== undefined && v !== '');

  return (
    <Paper withBorder p="md" radius="md" mb="md">
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
        <TextInput label="Locker code" placeholder="e.g. ENG-1A" leftSection={<IconSearch size={14} />} value={value.code ?? ''} onChange={(e) => set('code', e.currentTarget.value)} />
        <TextInput label="Student" placeholder="Name or university ID" leftSection={<IconSearch size={14} />} value={value.student ?? ''} onChange={(e) => set('student', e.currentTarget.value)} />
        <Select label="Status" placeholder="Any status" clearable data={toOptions(LOCKER_STATUSES)} value={value.status ?? null} onChange={(v) => set('status', (v as LockerStatus) ?? undefined)} />
        <Select label="Building" placeholder="All buildings" clearable data={buildingOptions(buildings.data)} value={value.buildingId ?? null} onChange={(v) => set('buildingId', v ?? undefined)} />
        <NumberInput label="Floor" placeholder="Any floor" min={-5} max={50} value={value.floor ?? ''} onChange={(v) => set('floor', typeof v === 'number' ? v : undefined)} />
        <TextInput label="Zone" placeholder="e.g. A" value={value.zone ?? ''} onChange={(e) => set('zone', e.currentTarget.value)} />
        <Select label="Size" placeholder="Any size" clearable data={toOptions(LOCKER_SIZES)} value={value.lockerSize ?? null} onChange={(v) => set('lockerSize', (v as LockerSize) ?? undefined)} />
        <DatePickerInput
          type="range"
          label="Subscription ends between"
          placeholder="Pick a date range"
          clearable
          value={[value.endsFrom ?? null, value.endsTo ?? null]}
          onChange={([from, to]) => onChange({ ...value, endsFrom: from ?? undefined, endsTo: to ?? undefined })}
        />
      </SimpleGrid>
      {hasFilters && (
        <Group justify="flex-end" mt="sm">
          <Button variant="subtle" size="xs" leftSection={<IconFilterOff size={14} />} onClick={() => onChange({})}>
            Clear filters
          </Button>
        </Group>
      )}
    </Paper>
  );
}
