import { Paper } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { RoleGroups } from '@/auth/roles';
import { EmptyState } from '@/shared/components/EmptyState';
import { PageHeader } from '@/shared/components/PageHeader';
import { PaginationBar } from '@/shared/components/PaginationBar';
import { QueryState } from '@/shared/components/QueryState';
import { useWorkOrders } from '../api';
import { WorkOrderFilters, type WorkOrderFilterValues } from '../components/WorkOrderFilters';
import { WorkOrderTable } from '../components/WorkOrderTable';

/** Managers see every work order; technicians see the jobs assigned to them. */
export function WorkOrderListPage() {
  const { hasRole } = useAuth();
  const isManager = hasRole(...RoleGroups.MANAGEMENT);
  const [filters, setFilters] = useState<WorkOrderFilterValues>({ activeOnly: true });
  const [debounced] = useDebouncedValue(filters, 300);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const workOrders = useWorkOrders({ ...debounced, page, size });

  return (
    <>
      <PageHeader title="Work orders" description={isManager ? 'Maintenance jobs across campus.' : 'Jobs assigned to you.'} />
      <WorkOrderFilters
        value={filters}
        showTechnician={isManager}
        onChange={(value) => {
          setFilters(value);
          setPage(1);
        }}
      />
      <Paper withBorder radius="md" p="md">
        <QueryState query={workOrders}>
          {(data) =>
            data.content.length === 0 ? (
              <EmptyState title="No work order found" description="Nothing matches the current filters." />
            ) : (
              <>
                <WorkOrderTable workOrders={data.content} />
                <PaginationBar
                  page={data}
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
    </>
  );
}
