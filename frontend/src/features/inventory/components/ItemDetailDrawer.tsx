import { Anchor, Drawer, Group, SimpleGrid, Stack, Table, Text, Title } from '@mantine/core';
import { Link } from 'react-router';
import { DetailItem } from '@/shared/components/DetailItem';
import { QueryState } from '@/shared/components/QueryState';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { formatDateTime, formatMoney } from '@/shared/utils/format';
import { useInventoryItem } from '../api';

/** Stock ledger of one item and the work orders waiting for it. */
export function ItemDetailDrawer({ itemId, onClose }: { itemId: string | null; onClose: () => void }) {
  const detail = useInventoryItem(itemId);
  return (
    <Drawer opened={itemId !== null} onClose={onClose} position="right" size="lg" title={<Text fw={700} size="lg">Inventory item</Text>}>
      <QueryState query={detail}>
        {({ item, movements, waitingWorkOrders }) => (
          <Stack>
            <Group gap="sm">
              <Title order={3}>{item.name}</Title>
              {item.isLowStock && <StatusBadge value="SHORTAGE" label="Low stock" />}
            </Group>
            <SimpleGrid cols={3}>
              <DetailItem label="SKU">{item.sku}</DetailItem>
              <DetailItem label="Category">{item.category}</DetailItem>
              <DetailItem label="Location">{item.storageLocation ?? '—'}</DetailItem>
              <DetailItem label="On hand">
                {item.quantityOnHand} {item.unit}
              </DetailItem>
              <DetailItem label="Reserved / available">
                {item.reservedQuantity} / {item.availableQuantity}
              </DetailItem>
              <DetailItem label="Unit cost">{formatMoney(item.unitCost)}</DetailItem>
            </SimpleGrid>

            <Title order={5}>Work orders waiting for this item</Title>
            {waitingWorkOrders.length === 0 ? (
              <Text size="sm" c="dimmed">
                None.
              </Text>
            ) : (
              waitingWorkOrders.map((m) => (
                <Text size="sm" key={m.id}>
                  <Anchor component={Link} to={`/work-orders/${m.workOrder.id}`} fw={600}>
                    {m.workOrder.code}
                  </Anchor>{' '}
                  needs {m.quantity} {m.item.unit} – {m.workOrder.title}
                </Text>
              ))
            )}

            <Title order={5}>Recent movements</Title>
            <Table fz="sm">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>When</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Qty</Table.Th>
                  <Table.Th>Note</Table.Th>
                  <Table.Th>By</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {movements.map((m) => (
                  <Table.Tr key={m.id}>
                    <Table.Td>{formatDateTime(m.createdAt)}</Table.Td>
                    <Table.Td>
                      <StatusBadge value={m.type} variant="outline" />
                    </Table.Td>
                    <Table.Td c={m.quantity < 0 ? 'red' : 'green'} fw={600}>
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </Table.Td>
                    <Table.Td>
                      {m.note}
                      {m.workOrder && (
                        <>
                          {' '}
                          (
                          <Anchor component={Link} to={`/work-orders/${m.workOrder.id}`}>
                            {m.workOrder.code}
                          </Anchor>
                          )
                        </>
                      )}
                    </Table.Td>
                    <Table.Td>{m.performedBy}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Stack>
        )}
      </QueryState>
    </Drawer>
  );
}
