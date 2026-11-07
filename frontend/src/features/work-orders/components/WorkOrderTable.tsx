import { Badge, Group, Table, Text } from '@mantine/core';
import { useNavigate } from 'react-router';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { enumLabel } from '@/shared/utils/labels';
import { formatDateTime } from '@/shared/utils/format';
import type { WorkOrder } from '../types';

export function WorkOrderTable({ workOrders }: { workOrders: WorkOrder[] }) {
  const navigate = useNavigate();
  return (
    <Table.ScrollContainer minWidth={950}>
      <Table striped highlightOnHover verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Code</Table.Th>
            <Table.Th>Title</Table.Th>
            <Table.Th>Type</Table.Th>
            <Table.Th>Priority</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Technician</Table.Th>
            <Table.Th>Location / asset</Table.Th>
            <Table.Th>Due</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {workOrders.map((wo) => (
            <Table.Tr key={wo.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/work-orders/${wo.id}`)}>
              <Table.Td fw={600}>{wo.code}</Table.Td>
              <Table.Td maw={280}>
                <Text size="sm" lineClamp={1}>
                  {wo.title}
                </Text>
                {wo.request && (
                  <Text size="xs" c="dimmed">
                    From {wo.request.code}
                  </Text>
                )}
              </Table.Td>
              <Table.Td>{enumLabel(wo.type)}</Table.Td>
              <Table.Td>
                <StatusBadge value={wo.priority} variant="filled" />
              </Table.Td>
              <Table.Td>
                <Group gap={4} wrap="nowrap">
                  <StatusBadge value={wo.status} />
                  {wo.isBlocked && (
                    <Badge color="red" variant="outline" size="sm">
                      Blocked
                    </Badge>
                  )}
                </Group>
              </Table.Td>
              <Table.Td>{wo.technician?.fullName ?? <Text size="sm" c="orange">Not assigned</Text>}</Table.Td>
              <Table.Td>
                <Text size="sm">{wo.building?.code ?? '—'}</Text>
                <Text size="xs" c="dimmed" lineClamp={1}>
                  {wo.asset ? `${wo.asset.code} – ${wo.asset.name}` : (wo.room?.name ?? '')}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm" c={wo.isOverdue ? 'red' : undefined} fw={wo.isOverdue ? 600 : undefined}>
                  {formatDateTime(wo.dueAt)}
                </Text>
                {wo.isOverdue && (
                  <Text size="xs" c="red">
                    Overdue
                  </Text>
                )}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
