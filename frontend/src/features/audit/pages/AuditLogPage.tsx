import { Badge, Paper, Select, SimpleGrid, Table, Text, TextInput } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDebouncedValue } from '@mantine/hooks';
import { IconSearch } from '@tabler/icons-react';
import { useState } from 'react';
import { EmptyState } from '@/shared/components/EmptyState';
import { PageHeader } from '@/shared/components/PageHeader';
import { PaginationBar } from '@/shared/components/PaginationBar';
import { QueryState } from '@/shared/components/QueryState';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { formatDateTime } from '@/shared/utils/format';
import { enumLabel } from '@/shared/utils/labels';
import { AUDIT_ENTITY_TYPES, useAuditLogs } from '../api';

/** Renders the JSON details of an entry as compact "key: value" pairs. */
function formatDetails(details: Record<string, unknown> | null): string {
  if (!details) return '—';
  return Object.entries(details)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
    .join(' • ');
}

/** Timestamped history of every important change (security, audit and quality assurance). */
export function AuditLogPage() {
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState<string | null>(null);
  const [range, setRange] = useState<[string | null, string | null]>([null, null]);
  const [debouncedAction] = useDebouncedValue(action, 300);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const logs = useAuditLogs({ action: debouncedAction, entityType: entityType ?? undefined, from: range[0] ?? undefined, to: range[1] ?? undefined, page, size });

  return (
    <>
      <PageHeader title="Audit log" description="Who changed what, and when." />
      <Paper withBorder p="md" radius="md" mb="md">
        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          <TextInput label="Action" placeholder="e.g. SUBSCRIPTION" leftSection={<IconSearch size={14} />} value={action} onChange={(e) => { setAction(e.currentTarget.value); setPage(1); }} />
          <Select label="Entity type" placeholder="All" clearable data={AUDIT_ENTITY_TYPES} value={entityType} onChange={(v) => { setEntityType(v); setPage(1); }} />
          <DatePickerInput type="range" label="Date range" clearable valueFormat="DD MMM YYYY" value={range} onChange={(v) => { setRange(v as [string | null, string | null]); setPage(1); }} />
        </SimpleGrid>
      </Paper>
      <Paper withBorder p="md" radius="md">
        <QueryState query={logs}>
          {(data) =>
            data.content.length === 0 ? (
              <EmptyState title="No audit entry" />
            ) : (
              <>
                <Table.ScrollContainer minWidth={900}>
                  <Table striped verticalSpacing="xs" fz="sm">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>When</Table.Th>
                        <Table.Th>Who</Table.Th>
                        <Table.Th>Action</Table.Th>
                        <Table.Th>Entity</Table.Th>
                        <Table.Th>Details</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {data.content.map((log) => (
                        <Table.Tr key={log.id}>
                          <Table.Td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(log.createdAt)}</Table.Td>
                          <Table.Td>
                            {log.actor ? (
                              <>
                                <Text size="sm">{log.actor.fullName}</Text>
                                <StatusBadge value={log.actor.role} size="xs" />
                              </>
                            ) : (
                              <Badge color="gray" variant="outline">
                                System
                              </Badge>
                            )}
                          </Table.Td>
                          <Table.Td>
                            <Badge variant="light">{enumLabel(log.action)}</Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{log.entityType}</Text>
                            {log.entityId && (
                              <Text size="xs" c="dimmed" ff="monospace">
                                {log.entityId.slice(0, 8)}
                              </Text>
                            )}
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs" lineClamp={3}>
                              {formatDetails(log.details)}
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
                <PaginationBar page={data} onPageChange={setPage} onSizeChange={(s) => { setSize(s); setPage(1); }} />
              </>
            )
          }
        </QueryState>
      </Paper>
    </>
  );
}
