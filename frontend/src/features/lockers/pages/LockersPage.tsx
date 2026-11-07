import { Button, Group, Paper, SegmentedControl, Text } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconLayoutGrid, IconList, IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { EmptyState } from '@/shared/components/EmptyState';
import { PageHeader } from '@/shared/components/PageHeader';
import { PaginationBar } from '@/shared/components/PaginationBar';
import { QueryState } from '@/shared/components/QueryState';
import { statusColor, enumLabel } from '@/shared/utils/labels';
import { LOCKER_STATUSES } from '@/shared/types/enums';
import { useLockers, useLockerSummary } from '../api';
import { LockerDetailDrawer } from '../components/LockerDetailDrawer';
import { LockerFilters, type LockerFilterValues } from '../components/LockerFilters';
import { LockerFormModal } from '../components/LockerFormModal';
import { LockerGrid } from '../components/LockerGrid';
import { LockerSummaryCards } from '../components/LockerSummaryCards';
import { LockerTable } from '../components/LockerTable';
import { StartSubscriptionModal } from '../components/StartSubscriptionModal';
import type { Locker } from '../types';

type View = 'grid' | 'table';

/** Administration of every student locker (facility managers and admins). */
export function LockersPage() {
  const [view, setView] = useState<View>('grid');
  const [filters, setFilters] = useState<LockerFilterValues>({});
  const [debouncedFilters] = useDebouncedValue(filters, 300);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(48);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [startLocker, setStartLocker] = useState<Locker | null>(null);
  const [creating, setCreating] = useState(false);

  const summary = useLockerSummary();
  const lockers = useLockers({ ...debouncedFilters, page, size, sortBy: 'code' });

  const changeFilters = (value: LockerFilterValues) => {
    setFilters(value);
    setPage(1);
  };

  return (
    <>
      <PageHeader
        title="Student lockers"
        description="All lockers with their occupant, subscription dates and cash payments."
        actions={
          <Button leftSection={<IconPlus size={16} />} variant="light" onClick={() => setCreating(true)}>
            New locker
          </Button>
        }
      />
      {summary.data && <LockerSummaryCards summary={summary.data} onStatusClick={(status) => changeFilters({ ...filters, status })} />}
      <LockerFilters value={filters} onChange={changeFilters} />

      <Paper withBorder radius="md" p="md">
        <Group justify="space-between" mb="md" wrap="wrap">
          <Group gap="md">
            {LOCKER_STATUSES.map((status) => (
              <Group key={status} gap={6}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: `var(--mantine-color-${statusColor(status)}-6)` }} />
                <Text size="xs">{enumLabel(status)}</Text>
              </Group>
            ))}
          </Group>
          <SegmentedControl
            size="xs"
            value={view}
            onChange={(v) => setView(v as View)}
            data={[
              { value: 'grid', label: <Group gap={4} wrap="nowrap"><IconLayoutGrid size={14} />Grid</Group> },
              { value: 'table', label: <Group gap={4} wrap="nowrap"><IconList size={14} />Table</Group> },
            ]}
          />
        </Group>
        <QueryState query={lockers}>
          {(data) =>
            data.content.length === 0 ? (
              <EmptyState title="No locker matches the filters" description="Try removing some filters." />
            ) : (
              <>
                {view === 'grid' ? (
                  <LockerGrid lockers={data.content} onSelect={(locker) => setSelectedId(locker.id)} />
                ) : (
                  <LockerTable lockers={data.content} onOpen={(locker) => setSelectedId(locker.id)} onStart={setStartLocker} />
                )}
                <PaginationBar
                  page={data}
                  sizeOptions={[24, 48, 96]}
                  onPageChange={setPage}
                  onSizeChange={(s) => {
                    setSize(s);
                    setPage(1);
                  }}
                />
              </>
            )
          }
        </QueryState>
      </Paper>

      <LockerDetailDrawer lockerId={selectedId} onClose={() => setSelectedId(null)} onStart={setStartLocker} />
      <StartSubscriptionModal locker={startLocker} onClose={() => setStartLocker(null)} />
      <LockerFormModal opened={creating} onClose={() => setCreating(false)} />
    </>
  );
}
