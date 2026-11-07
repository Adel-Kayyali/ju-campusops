import { Anchor, Button, Group, Select, Table, Text } from '@mantine/core';
import { IconCheck, IconPackageImport, IconPlus, IconX } from '@tabler/icons-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { EmptyState } from '@/shared/components/EmptyState';
import { PaginationBar } from '@/shared/components/PaginationBar';
import { QueryState } from '@/shared/components/QueryState';
import { ReasonModal } from '@/shared/components/ReasonModal';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { PROCUREMENT_STATUSES, type ProcurementStatus } from '@/shared/types/enums';
import { formatDate } from '@/shared/utils/format';
import { toOptions } from '@/shared/utils/labels';
import { notify } from '@/shared/utils/notify';
import { inventoryApi, useInventoryMutation, useProcurements } from '../api';
import type { Procurement } from '../types';
import { NewProcurementModal } from './NewProcurementModal';

type Decision = { procurement: Procurement; action: 'approve' | 'reject' };

/** Purchase requests: PENDING_APPROVAL -> APPROVED -> RECEIVED (or REJECTED). */
export function ProcurementTab({ isManager }: { isManager: boolean }) {
  const [status, setStatus] = useState<ProcurementStatus | null>(null);
  const [page, setPage] = useState(1);
  const procurements = useProcurements({ status: status ?? undefined, page, size: 20 });
  const [creating, setCreating] = useState(false);
  const [decision, setDecision] = useState<Decision | null>(null);

  const decide = useInventoryMutation(({ procurement, action, note }: Decision & { note?: string }) =>
    action === 'approve' ? inventoryApi.approve(procurement.id, note) : inventoryApi.reject(procurement.id, note),
  );
  const receive = useInventoryMutation(inventoryApi.receive);

  return (
    <>
      <Group justify="space-between" align="flex-end" mb="md">
        <Select label="Status" placeholder="All" clearable w={220} data={toOptions(PROCUREMENT_STATUSES)} value={status} onChange={(v) => { setStatus(v as ProcurementStatus | null); setPage(1); }} />
        <Button leftSection={<IconPlus size={16} />} onClick={() => setCreating(true)}>
          New request
        </Button>
      </Group>
      <QueryState query={procurements}>
        {(data) =>
          data.content.length === 0 ? (
            <EmptyState title="No procurement request" />
          ) : (
            <>
              <Table.ScrollContainer minWidth={1000}>
                <Table striped verticalSpacing="sm">
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Code</Table.Th>
                      <Table.Th>Item</Table.Th>
                      <Table.Th>Qty</Table.Th>
                      <Table.Th>Reason</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Requested</Table.Th>
                      <Table.Th>Decision</Table.Th>
                      {isManager && <Table.Th />}
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {data.content.map((p) => (
                      <Table.Tr key={p.id}>
                        <Table.Td fw={600}>{p.code}</Table.Td>
                        <Table.Td>
                          <Text size="sm">{p.item.name}</Text>
                          <Text size="xs" c="dimmed">
                            {p.item.sku}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          {p.quantity} {p.item.unit}
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{p.reason}</Text>
                          {p.workOrder && (
                            <Anchor component={Link} to={`/work-orders/${p.workOrder.id}`} size="xs">
                              {p.workOrder.code}
                            </Anchor>
                          )}
                        </Table.Td>
                        <Table.Td>
                          <StatusBadge value={p.status} />
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{formatDate(p.createdAt)}</Text>
                          <Text size="xs" c="dimmed">
                            {p.requestedBy}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          {p.decidedBy ? (
                            <>
                              <Text size="sm">
                                {p.decidedBy} • {formatDate(p.decidedAt)}
                              </Text>
                              {p.decisionNote && (
                                <Text size="xs" c="dimmed">
                                  {p.decisionNote}
                                </Text>
                              )}
                              {p.receivedAt && (
                                <Text size="xs" c="green">
                                  Received {formatDate(p.receivedAt)}
                                </Text>
                              )}
                            </>
                          ) : (
                            '—'
                          )}
                        </Table.Td>
                        {isManager && (
                          <Table.Td>
                            <Group gap={4} justify="flex-end" wrap="nowrap">
                              {p.status === 'PENDING_APPROVAL' && (
                                <>
                                  <Button size="xs" variant="light" color="green" leftSection={<IconCheck size={14} />} onClick={() => setDecision({ procurement: p, action: 'approve' })}>
                                    Approve
                                  </Button>
                                  <Button size="xs" variant="light" color="red" leftSection={<IconX size={14} />} onClick={() => setDecision({ procurement: p, action: 'reject' })}>
                                    Reject
                                  </Button>
                                </>
                              )}
                              {p.status === 'APPROVED' && (
                                <Button
                                  size="xs"
                                  variant="light"
                                  leftSection={<IconPackageImport size={14} />}
                                  loading={receive.isPending && receive.variables === p.id}
                                  onClick={() => receive.mutate(p.id, { onSuccess: () => notify.success(`${p.quantity} ${p.item.unit} added to stock`, 'Goods received'), onError: notify.error })}
                                >
                                  Mark received
                                </Button>
                              )}
                            </Group>
                          </Table.Td>
                        )}
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
              <PaginationBar page={data} onPageChange={setPage} />
            </>
          )
        }
      </QueryState>
      <NewProcurementModal opened={creating} onClose={() => setCreating(false)} />
      <ReasonModal
        opened={decision !== null}
        title={`${decision?.action === 'approve' ? 'Approve' : 'Reject'} ${decision?.procurement.code ?? ''}`}
        label="Note"
        required={decision?.action === 'reject'}
        confirmLabel={decision?.action === 'approve' ? 'Approve' : 'Reject'}
        confirmColor={decision?.action === 'approve' ? 'green' : 'red'}
        loading={decide.isPending}
        onClose={() => setDecision(null)}
        onConfirm={(note) =>
          decide.mutate(
            { ...decision!, note: note || undefined },
            {
              onSuccess: () => {
                notify.success(`Procurement ${decision!.action === 'approve' ? 'approved' : 'rejected'}`);
                setDecision(null);
              },
              onError: notify.error,
            },
          )
        }
      />
    </>
  );
}
