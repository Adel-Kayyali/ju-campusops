import { Button, Checkbox, Group, Paper, Select, SimpleGrid, TextInput } from '@mantine/core';
import { IconFilterOff, IconSearch } from '@tabler/icons-react';
import { buildingOptions, useBuildings } from '@/features/locations/api';
import { PRIORITIES, REQUEST_CATEGORIES, REQUEST_STATUSES, type Priority, type RequestCategory, type RequestStatus } from '@/shared/types/enums';
import { toOptions } from '@/shared/utils/labels';
import type { RequestQuery } from '../types';

export type RequestFilterValues = Pick<RequestQuery, 'search' | 'status' | 'category' | 'priority' | 'buildingId' | 'openOnly' | 'overdueOnly' | 'escalatedOnly' | 'mine'>;

interface RequestFiltersProps {
  value: RequestFilterValues;
  onChange: (value: RequestFilterValues) => void;
  showMine: boolean;
}

export function RequestFilters({ value, onChange, showMine }: RequestFiltersProps) {
  const buildings = useBuildings();
  const set = <K extends keyof RequestFilterValues>(key: K, v: RequestFilterValues[K]) => onChange({ ...value, [key]: v || undefined });
  const hasFilters = Object.values(value).some((v) => v !== undefined && v !== '' && v !== false);

  return (
    <Paper withBorder p="md" radius="md" mb="md">
      <SimpleGrid cols={{ base: 1, sm: 2, md: 5 }}>
        <TextInput label="Search" placeholder="Code or title" leftSection={<IconSearch size={14} />} value={value.search ?? ''} onChange={(e) => set('search', e.currentTarget.value)} />
        <Select label="Status" placeholder="Any status" clearable data={toOptions(REQUEST_STATUSES)} value={value.status ?? null} onChange={(v) => set('status', (v as RequestStatus) ?? undefined)} />
        <Select label="Category" placeholder="Any category" clearable data={toOptions(REQUEST_CATEGORIES)} value={value.category ?? null} onChange={(v) => set('category', (v as RequestCategory) ?? undefined)} />
        <Select label="Priority" placeholder="Any priority" clearable data={toOptions(PRIORITIES)} value={value.priority ?? null} onChange={(v) => set('priority', (v as Priority) ?? undefined)} />
        <Select label="Building" placeholder="All buildings" clearable data={buildingOptions(buildings.data)} value={value.buildingId ?? null} onChange={(v) => set('buildingId', v ?? undefined)} />
      </SimpleGrid>
      <Group mt="sm" justify="space-between">
        <Group gap="lg">
          <Checkbox label="Open only" checked={Boolean(value.openOnly)} onChange={(e) => set('openOnly', e.currentTarget.checked)} />
          <Checkbox label="Overdue only" checked={Boolean(value.overdueOnly)} onChange={(e) => set('overdueOnly', e.currentTarget.checked)} />
          <Checkbox label="Escalated only" checked={Boolean(value.escalatedOnly)} onChange={(e) => set('escalatedOnly', e.currentTarget.checked)} />
          {showMine && <Checkbox label="Submitted by me" checked={Boolean(value.mine)} onChange={(e) => set('mine', e.currentTarget.checked)} />}
        </Group>
        {hasFilters && (
          <Button variant="subtle" size="xs" leftSection={<IconFilterOff size={14} />} onClick={() => onChange({})}>
            Clear filters
          </Button>
        )}
      </Group>
    </Paper>
  );
}
