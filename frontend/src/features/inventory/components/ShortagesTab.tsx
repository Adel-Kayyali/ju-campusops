import { Anchor, Table, Text } from '@mantine/core';
import { Link } from 'react-router';
import { EmptyState } from '@/shared/components/EmptyState';
import { QueryState } from '@/shared/components/QueryState';
import { formatDateTime } from '@/shared/utils/format';
import { useShortages } from '../api';

/** Work orders blocked because spare parts are missing. */
export function ShortagesTab() {
  const shortages = useShortages();
  return (
    <QueryState query={shortages}>
      {(list) =>
        list.length === 0 ? (
          <EmptyState title="No shortage" description="Every work order has the parts it needs." />
        ) : (
          <Table striped verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Work order</Table.Th>
                <Table.Th>Item</Table.Th>
                <Table.Th>Quantity needed</Table.Th>
                <Table.Th>Waiting since</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {list.map((m) => (
                <Table.Tr key={m.id}>
                  <Table.Td>
                    <Anchor component={Link} to={`/work-orders/${m.workOrder.id}`} fw={600}>
                      {m.workOrder.code}
                    </Anchor>
                    <Text size="xs" c="dimmed">
                      {m.workOrder.title}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    {m.item.sku} – {m.item.name}
                  </Table.Td>
                  <Table.Td>
                    {m.quantity} {m.item.unit}
                  </Table.Td>
                  <Table.Td>{formatDateTime(m.createdAt)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )
      }
    </QueryState>
  );
}
