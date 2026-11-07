import { Badge, Button, Paper, Table, Text } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/auth/AuthContext';
import { RoleGroups } from '@/auth/roles';
import { EmptyState } from '@/shared/components/EmptyState';
import { PageHeader } from '@/shared/components/PageHeader';
import { PaginationBar } from '@/shared/components/PaginationBar';
import { QueryState } from '@/shared/components/QueryState';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { formatDate } from '@/shared/utils/format';
import { enumLabel } from '@/shared/utils/labels';
import { useAssets } from '../api';
import { AssetFilters, type AssetFilterValues } from '../components/AssetFilters';
import { AssetFormModal } from '../components/AssetFormModal';

/** Facilities & asset registry. */
export function AssetListPage() {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [filters, setFilters] = useState<AssetFilterValues>({});
  const [debounced] = useDebouncedValue(filters, 300);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const [creating, setCreating] = useState(false);
  const assets = useAssets({ ...debounced, page, size });

  return (
    <>
      <PageHeader
        title="Assets"
        description="Classrooms equipment, elevators, HVAC units and lab equipment with their maintenance and warranty."
        actions={
          hasRole(...RoleGroups.MANAGEMENT) && (
            <Button leftSection={<IconPlus size={16} />} onClick={() => setCreating(true)}>
              New asset
            </Button>
          )
        }
      />
      <AssetFilters
        value={filters}
        onChange={(v) => {
          setFilters(v);
          setPage(1);
        }}
      />
      <Paper withBorder radius="md" p="md">
        <QueryState query={assets}>
          {(data) =>
            data.content.length === 0 ? (
              <EmptyState title="No asset matches the filters" />
            ) : (
              <>
                <Table.ScrollContainer minWidth={900}>
                  <Table striped highlightOnHover verticalSpacing="sm">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Code</Table.Th>
                        <Table.Th>Name</Table.Th>
                        <Table.Th>Type</Table.Th>
                        <Table.Th>Location</Table.Th>
                        <Table.Th>Status</Table.Th>
                        <Table.Th>Warranty</Table.Th>
                        <Table.Th>Open work</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {data.content.map((asset) => (
                        <Table.Tr key={asset.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/assets/${asset.id}`)}>
                          <Table.Td fw={600}>{asset.code}</Table.Td>
                          <Table.Td>{asset.name}</Table.Td>
                          <Table.Td>{enumLabel(asset.type)}</Table.Td>
                          <Table.Td>
                            <Text size="sm">{asset.building.code}</Text>
                            <Text size="xs" c="dimmed">
                              {asset.room ? `${asset.room.code} – ${asset.room.name}` : asset.building.name}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <StatusBadge value={asset.status} />
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{formatDate(asset.warrantyExpiry)}</Text>
                            {asset.warrantyStatus !== 'NONE' && <StatusBadge value={asset.warrantyStatus} size="xs" />}
                          </Table.Td>
                          <Table.Td>{asset.openWorkOrders > 0 ? <Badge color="yellow">{asset.openWorkOrders}</Badge> : '—'}</Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
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
      <AssetFormModal opened={creating} onClose={() => setCreating(false)} />
    </>
  );
}
