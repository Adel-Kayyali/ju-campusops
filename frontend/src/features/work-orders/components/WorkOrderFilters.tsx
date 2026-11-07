import { Button, Checkbox, Group, Paper, Select, SimpleGrid, TextInput } from '@mantine/core';
import { IconFilterOff, IconSearch } from '@tabler/icons-react';
import { PRIORITIES, WORK_ORDER_STATUSES, type Priority, type WorkOrderStatus, type WorkOrderType } from '@/shared/types/enums';
import { toOptions } from '@/shared/utils/labels';
import { useTechnicianOptions } from '../api';
import type { WorkOrderQuery } from '../types';

export type WorkOrderFilterValues = Pick<WorkOrderQuery, 'search' | 'status' | 'type' | 'priority' | 'technicianId' | 'activeOnly' | 'blockedOnly' | 'overdueOnly'>;

interface WorkOrderFiltersProps {
  value: WorkOrderFilterValues;
  onChange: (value: WorkOrderFilterValues) => void;
  showTechnician: boolean;
}

export function WorkOrderFilters({ value, onChange, showTechnician }: WorkOrderFiltersProps) {
  const technicians = useTechnicianOptions(showTechnician);
  const set = <K extends keyof WorkOrderFilterValues>(key: K, v: WorkOrderFilterValues[K]) => onChange({ ...value, [key]: v || undefined });
  const hasFilters = Object.values(value).some((v) => v !== undefined && v !== '' && v !== false);

  return (
    <Paper withBorder p="md" radius="md" mb="md">
      <SimpleGrid cols={{ base: 1, sm: 2, md: showTechnician ? 5 : 4 }}>
        <TextInput label="Search" placeholder="Code or title" leftSection={<IconSearch size={14} />} value={value.search ?? ''} onChange={(e) => set('search', e.currentTarget.value)} />
        <Select label="Status" placeholder="Any status" clearable data={toOptions(WORK_ORDER_STATUSES)} value={value.status ?? null} onChange={(v) => set('status', (v as WorkOrderStatus) ?? undefined)} />
        <Select label="Type" placeholder="Any type" clearable data={toOptions(['CORRECTIVE', 'PREVENTIVE'] as WorkOrderType[])} value={value.type ?? null} onChange={(v) => set('type', (v as WorkOrderType) ?? undefined)} />
        <Select label="Priority" placeholder="Any priority" clearable data={toOptions(PRIORITIES)} value={value.priority ?? null} onChange={(v) => set('priority', (v as Priority) ?? undefined)} />
        {showTechnician && (
          <Select
            label="Technician"
            placeholder="Everyone"
            clearable
            searchable
            data={(technicians.data ?? []).map((t) => ({ value: t.id, label: t.fullName }))}
            value={value.technicianId ?? null}
            onChange={(v) => set('technicianId', v ?? undefined)}
          />
        )}
      </SimpleGrid>
      <Group mt="sm" justify="space-between">
        <Group gap="lg">
          <Checkbox label="Active only" checked={Boolean(value.activeOnly)} onChange={(e) => set('activeOnly', e.currentTarget.checked)} />
          <Checkbox label="Waiting for parts" checked={Boolean(value.blockedOnly)} onChange={(e) => set('blockedOnly', e.currentTarget.checked)} />
          <Checkbox label="Overdue only" checked={Boolean(value.overdueOnly)} onChange={(e) => set('overdueOnly', e.currentTarget.checked)} />
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
