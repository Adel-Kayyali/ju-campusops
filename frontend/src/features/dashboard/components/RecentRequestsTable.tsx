import { Anchor, Badge, Group, Table, Text } from '@mantine/core';
import { Link } from 'react-router';
import { EmptyState } from '@/shared/components/EmptyState';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { formatRelative } from '@/shared/utils/format';
import type { RecentRequest } from '../types';

export function RecentRequestsTable({ requests }: { requests: RecentRequest[] }) {
  if (requests.length === 0) {
    return <EmptyState title="No request yet" />;
  }
  return (
    <Table.ScrollContainer minWidth={560}>
      <Table verticalSpacing="xs" highlightOnHover>
        <Table.Tbody>
          {requests.map((r) => (
            <Table.Tr key={r.id}>
              <Table.Td>
                <Anchor component={Link} to={`/requests/${r.id}`} fw={600} size="sm">
                  {r.code}
                </Anchor>
              </Table.Td>
              <Table.Td>
                <Group gap={6} wrap="nowrap">
                  <Text size="sm" lineClamp={1}>
                    {r.title}
                  </Text>
                  {r.isEscalated && (
                    <Badge size="xs" color="red" variant="outline">
                      Escalated
                    </Badge>
                  )}
                </Group>
              </Table.Td>
              <Table.Td>
                <StatusBadge value={r.priority} variant="filled" size="sm" />
              </Table.Td>
              <Table.Td>
                <StatusBadge value={r.status} size="sm" />
              </Table.Td>
              <Table.Td>
                <Text size="xs" c="dimmed">
                  {formatRelative(r.createdAt)}
                </Text>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
