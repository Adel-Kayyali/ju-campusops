import { Alert, Anchor, Badge, Button, Group, Paper, SimpleGrid, Stack, Table, Text, Title } from '@mantine/core';
import { IconAlertTriangle, IconArrowLeft, IconClipboardPlus, IconEdit, IconRepeat } from '@tabler/icons-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useAuth } from '@/auth/AuthContext';
import { RoleGroups } from '@/auth/roles';
import { DetailItem } from '@/shared/components/DetailItem';
import { EmptyState } from '@/shared/components/EmptyState';
import { QueryState } from '@/shared/components/QueryState';
import { StatCard } from '@/shared/components/StatCard';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { formatDate, formatDateTime } from '@/shared/utils/format';
import { enumLabel } from '@/shared/utils/labels';
import { useAssetDetail } from '../api';
import { AssetFormModal } from '../components/AssetFormModal';
import { AssetWorkOrderModal } from '../components/AssetWorkOrderModal';
import { REPEAT_FAILURE_THRESHOLD, type Asset } from '../types';

/** One asset: details, warranty, maintenance history and preventive schedules. */
export function AssetDetailPage() {
  const { id } = useParams();
  const detail = useAssetDetail(id);
  const { hasRole } = useAuth();
  const isManager = hasRole(...RoleGroups.MANAGEMENT);
  const [editing, setEditing] = useState(false);
  const [workOrderFor, setWorkOrderFor] = useState<Asset | null>(null);

  return (
    <>
      <Anchor component={Link} to="/assets" size="sm" mb="sm" display="inline-flex" style={{ alignItems: 'center', gap: 4 }}>
        <IconArrowLeft size={14} /> All assets
      </Anchor>
      <QueryState query={detail}>
        {({ asset, maintenanceHistory, schedules, failuresLast90Days }) => (
          <Stack>
            <Group justify="space-between" wrap="wrap">
              <Group gap="sm">
                <Title order={2}>{asset.name}</Title>
                <Badge variant="outline">{asset.code}</Badge>
                <StatusBadge value={asset.status} size="lg" />
              </Group>
              {isManager && (
                <Group gap="xs">
                  <Button variant="default" leftSection={<IconEdit size={16} />} onClick={() => setEditing(true)}>
                    Edit
                  </Button>
                  <Button leftSection={<IconClipboardPlus size={16} />} onClick={() => setWorkOrderFor(asset)}>
                    Create work order
                  </Button>
                </Group>
              )}
            </Group>

            {failuresLast90Days >= REPEAT_FAILURE_THRESHOLD && (
              <Alert color="orange" icon={<IconAlertTriangle size={18} />} title="Repeat failures">
                This asset needed {failuresLast90Days} corrective repairs in the last 90 days. Consider a deeper inspection or replacement.
              </Alert>
            )}

            <SimpleGrid cols={{ base: 1, sm: 3 }}>
              <StatCard label="Failures (90 days)" value={failuresLast90Days} icon={<IconRepeat size={22} />} color={failuresLast90Days >= REPEAT_FAILURE_THRESHOLD ? 'orange' : 'blue'} />
              <StatCard label="Open work orders" value={asset.openWorkOrders} icon={<IconClipboardPlus size={22} />} color="yellow" />
              <StatCard label="Warranty" value={enumLabel(asset.warrantyStatus)} icon={<IconAlertTriangle size={22} />} color={asset.warrantyStatus === 'EXPIRED' ? 'red' : asset.warrantyStatus === 'EXPIRING_SOON' ? 'orange' : 'green'} hint={asset.warrantyExpiry ? `Until ${formatDate(asset.warrantyExpiry)}` : 'No warranty recorded'} />
            </SimpleGrid>

            <Paper withBorder radius="md" p="md">
              <SimpleGrid cols={{ base: 2, md: 4 }}>
                <DetailItem label="Type">{enumLabel(asset.type)}</DetailItem>
                <DetailItem label="Building">{asset.building.name}</DetailItem>
                <DetailItem label="Room">{asset.room ? `${asset.room.code} – ${asset.room.name}` : '—'}</DetailItem>
                <DetailItem label="Manufacturer / model">{[asset.manufacturer, asset.model].filter(Boolean).join(' ') || '—'}</DetailItem>
                <DetailItem label="Serial number">{asset.serialNumber ?? '—'}</DetailItem>
                <DetailItem label="Installed">{formatDate(asset.installDate)}</DetailItem>
                <DetailItem label="Warranty expiry">{formatDate(asset.warrantyExpiry)}</DetailItem>
                <DetailItem label="Notes">{asset.notes ?? '—'}</DetailItem>
              </SimpleGrid>
            </Paper>

            <Paper withBorder radius="md" p="md">
              <Title order={4} mb="sm">
                Preventive schedules
              </Title>
              {schedules.length === 0 ? (
                <Text size="sm" c="dimmed">
                  No preventive schedule for this asset.{' '}
                  <Anchor component={Link} to="/maintenance">
                    Manage schedules
                  </Anchor>
                </Text>
              ) : (
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Title</Table.Th>
                      <Table.Th>Every</Table.Th>
                      <Table.Th>Next due</Table.Th>
                      <Table.Th>Active</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {schedules.map((s) => (
                      <Table.Tr key={s.id}>
                        <Table.Td>{s.title}</Table.Td>
                        <Table.Td>{s.every}</Table.Td>
                        <Table.Td>{formatDate(s.nextDueDate)}</Table.Td>
                        <Table.Td>{s.isActive ? <Badge color="green">Active</Badge> : <Badge color="gray">Paused</Badge>}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </Paper>

            <Paper withBorder radius="md" p="md">
              <Title order={4} mb="sm">
                Maintenance history
              </Title>
              {maintenanceHistory.length === 0 ? (
                <EmptyState title="No maintenance recorded yet" />
              ) : (
                <Table.ScrollContainer minWidth={800}>
                  <Table striped>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Work order</Table.Th>
                        <Table.Th>Type</Table.Th>
                        <Table.Th>Title</Table.Th>
                        <Table.Th>Status</Table.Th>
                        <Table.Th>Technician</Table.Th>
                        <Table.Th>Created</Table.Th>
                        <Table.Th>Completed</Table.Th>
                        <Table.Th>Notes</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {maintenanceHistory.map((record) => (
                        <Table.Tr key={record.workOrderId}>
                          <Table.Td>
                            <Anchor component={Link} to={`/work-orders/${record.workOrderId}`} fw={600}>
                              {record.code}
                            </Anchor>
                          </Table.Td>
                          <Table.Td>
                            <StatusBadge value={record.type} variant="outline" />
                          </Table.Td>
                          <Table.Td>{record.title}</Table.Td>
                          <Table.Td>
                            <StatusBadge value={record.status} />
                          </Table.Td>
                          <Table.Td>{record.technician ?? '—'}</Table.Td>
                          <Table.Td>{formatDate(record.createdAt)}</Table.Td>
                          <Table.Td>{formatDateTime(record.completedAt)}</Table.Td>
                          <Table.Td>
                            <Text size="xs" lineClamp={2}>
                              {record.repairNotes ?? '—'}
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
              )}
            </Paper>
            <AssetFormModal opened={editing} asset={asset} onClose={() => setEditing(false)} />
            <AssetWorkOrderModal asset={workOrderFor} onClose={() => setWorkOrderFor(null)} />
          </Stack>
        )}
      </QueryState>
    </>
  );
}
