import { Paper, Select, SimpleGrid, TextInput } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { buildingOptions, useBuildings } from '@/features/locations/api';
import { ASSET_STATUSES, ASSET_TYPES, WARRANTY_STATUSES, type AssetStatus, type AssetType, type WarrantyStatus } from '@/shared/types/enums';
import { toOptions } from '@/shared/utils/labels';
import type { AssetQuery } from '../types';

export type AssetFilterValues = Pick<AssetQuery, 'search' | 'buildingId' | 'type' | 'status' | 'warranty'>;

export function AssetFilters({ value, onChange }: { value: AssetFilterValues; onChange: (value: AssetFilterValues) => void }) {
  const buildings = useBuildings();
  const set = <K extends keyof AssetFilterValues>(key: K, v: AssetFilterValues[K] | null) => onChange({ ...value, [key]: v || undefined });
  return (
    <Paper withBorder p="md" radius="md" mb="md">
      <SimpleGrid cols={{ base: 1, sm: 2, md: 5 }}>
        <TextInput label="Search" placeholder="Code, name, serial, maker" leftSection={<IconSearch size={14} />} value={value.search ?? ''} onChange={(e) => set('search', e.currentTarget.value)} />
        <Select label="Building" placeholder="All" clearable data={buildingOptions(buildings.data)} value={value.buildingId ?? null} onChange={(v) => set('buildingId', v)} />
        <Select label="Type" placeholder="All" clearable data={toOptions(ASSET_TYPES)} value={value.type ?? null} onChange={(v) => set('type', v as AssetType | null)} />
        <Select label="Status" placeholder="All" clearable data={toOptions(ASSET_STATUSES)} value={value.status ?? null} onChange={(v) => set('status', v as AssetStatus | null)} />
        <Select label="Warranty" placeholder="Any" clearable data={toOptions(WARRANTY_STATUSES)} value={value.warranty ?? null} onChange={(v) => set('warranty', v as WarrantyStatus | null)} />
      </SimpleGrid>
    </Paper>
  );
}
