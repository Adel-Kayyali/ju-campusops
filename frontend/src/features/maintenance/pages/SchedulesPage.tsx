import { ActionIcon, Anchor, Badge, Button, Group, Paper, Switch, Table, Text } from '@mantine/core';
import { IconEdit, IconPlayerPlay, IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@/auth/AuthContext';
import { RoleGroups } from '@/auth/roles';
import { useTechnicians } from '@/features/technicians/api';
import { EmptyState } from '@/shared/components/EmptyState';
import { PageHeader } from '@/shared/components/PageHeader';
import { QueryState } from '@/shared/components/QueryState';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { formatDate } from '@/shared/utils/format';
import { notify } from '@/shared/utils/notify';
import { schedulesApi, useScheduleMutation, useSchedules } from '../api';
import { GenerationResultModal } from '../components/GenerationResultModal';
import { ScheduleFormModal } from '../components/ScheduleFormModal';
import type { GenerationResult, Schedule } from '../types';

/** Recurring inspections that become planned work orders before equipment is overdue. */
export function SchedulesPage() {
  const { hasRole } = useAuth();
  const isManager = hasRole(...RoleGroups.MANAGEMENT);
  const [activeOnly, setActiveOnly] = useState(false);
  const schedules = useSchedules({ activeOnly });
  const technicians = useTechnicians();
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);

  const generate = useScheduleMutation(() => schedulesApi.generate());
  const toggle = useScheduleMutation(({ id, isActive }: { id: string; isActive: boolean }) => schedulesApi.update(id, { isActive }));
  const technicianName = (id: string | null) => technicians.data?.find((t) => t.id === id)?.fullName ?? '—';

  return (
    <>
      <PageHeader
        title="Preventive maintenance"
        description="Planned work orders are generated automatically every day, a few days (lead time) before each due date."
        actions={
          isManager && (
            <>
              <Button variant="light" leftSection={<IconPlayerPlay size={16} />} loading={generate.isPending} onClick={() => generate.mutate(undefined, { onSuccess: setResult, onError: notify.error })}>
                Generate due work now
              </Button>
              <Button leftSection={<IconPlus size={16} />} onClick={() => setCreating(true)}>
                New schedule
              </Button>
            </>
          )
        }
      />
      <Paper withBorder radius="md" p="md">
        <Group justify="flex-end" mb="sm">
          <Switch label="Active schedules only" checked={activeOnly} onChange={(e) => setActiveOnly(e.currentTarget.checked)} />
        </Group>
        <QueryState query={schedules}>
          {(list) =>
            list.length === 0 ? (
              <EmptyState title="No preventive schedule" />
            ) : (
              <Table.ScrollContainer minWidth={1000}>
                <Table striped highlightOnHover verticalSpacing="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Asset</Table.Th>
                      <Table.Th>Task</Table.Th>
                      <Table.Th>Every</Table.Th>
                      <Table.Th>Next due</Table.Th>
                      <Table.Th>Lead</Table.Th>
                      <Table.Th>Priority</Table.Th>
                      <Table.Th>Technician</Table.Th>
                      <Table.Th>Open work</Table.Th>
                      <Table.Th>Active</Table.Th>
                      {isManager && <Table.Th />}
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {list.map((s) => (
                      <Table.Tr key={s.id}>
                        <Table.Td>
                          <Anchor component={Link} to={`/assets/${s.asset.id}`} fw={600} size="sm">
                            {s.asset.code}
                          </Anchor>
                          <Text size="xs" c="dimmed">
                            {s.asset.building.code} – {s.asset.name}
                          </Text>
                        </Table.Td>
                        <Table.Td>{s.title}</Table.Td>
                        <Table.Td>{s.every}</Table.Td>
                        <Table.Td>
                          <Text size="sm">{formatDate(s.nextDueDate)}</Text>
                          {s.isDueForGeneration && (
                            <Badge size="xs" color="orange">
                              Due for generation
                            </Badge>
                          )}
                        </Table.Td>
                        <Table.Td>{s.leadDays} d</Table.Td>
                        <Table.Td>
                          <StatusBadge value={s.priority} />
                        </Table.Td>
                        <Table.Td>{technicianName(s.defaultTechnicianId)}</Table.Td>
                        <Table.Td>{s.openWorkOrders > 0 ? <Badge color="yellow">{s.openWorkOrders}</Badge> : '—'}</Table.Td>
                        <Table.Td>
                          <Switch
                            checked={s.isActive}
                            disabled={!isManager}
                            onChange={(e) => toggle.mutate({ id: s.id, isActive: e.currentTarget.checked }, { onError: notify.error })}
                            aria-label="Active"
                          />
                        </Table.Td>
                        {isManager && (
                          <Table.Td>
                            <ActionIcon variant="subtle" onClick={() => setEditing(s)} aria-label="Edit">
                              <IconEdit size={16} />
                            </ActionIcon>
                          </Table.Td>
                        )}
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            )
          }
        </QueryState>
      </Paper>
      <ScheduleFormModal opened={creating || editing !== null} schedule={editing} onClose={() => { setCreating(false); setEditing(null); }} />
      <GenerationResultModal result={result} onClose={() => setResult(null)} />
    </>
  );
}
