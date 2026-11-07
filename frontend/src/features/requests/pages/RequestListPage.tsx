import { Button, Paper } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@/auth/AuthContext';
import { RoleGroups } from '@/auth/roles';
import { EmptyState } from '@/shared/components/EmptyState';
import { PageHeader } from '@/shared/components/PageHeader';
import { PaginationBar } from '@/shared/components/PaginationBar';
import { QueryState } from '@/shared/components/QueryState';
import { useRequests } from '../api';
import { RequestFilters, type RequestFilterValues } from '../components/RequestFilters';
import { RequestTable } from '../components/RequestTable';

/** Requesters see their own requests, technicians their assignments, managers everything. */
export function RequestListPage() {
  const { hasRole } = useAuth();
  const isManager = hasRole(...RoleGroups.MANAGEMENT);
  const [filters, setFilters] = useState<RequestFilterValues>({});
  const [debounced] = useDebouncedValue(filters, 300);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const requests = useRequests({ ...debounced, page, size });

  return (
    <>
      <PageHeader
        title="Service requests"
        description={isManager ? 'Every facility issue reported on campus.' : 'Issues you reported and their progress.'}
        actions={
          <Button component={Link} to="/requests/new" leftSection={<IconPlus size={16} />}>
            New request
          </Button>
        }
      />
      <RequestFilters
        value={filters}
        showMine={isManager}
        onChange={(value) => {
          setFilters(value);
          setPage(1);
        }}
      />
      <Paper withBorder radius="md" p="md">
        <QueryState query={requests}>
          {(data) =>
            data.content.length === 0 ? (
              <EmptyState
                title="No request found"
                description="Nothing matches the filters, or no problem has been reported yet."
                action={
                  <Button component={Link} to="/requests/new" variant="light" size="xs">
                    Report a problem
                  </Button>
                }
              />
            ) : (
              <>
                <RequestTable requests={data.content} />
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
