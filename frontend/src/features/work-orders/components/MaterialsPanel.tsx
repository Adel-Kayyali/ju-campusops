import { Button, Group, NumberInput, Select, Stack, Table, Text } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { notify } from '@/shared/utils/notify';
import { useInventoryItemOptions, useWorkOrderMutation, workOrdersApi } from '../api';
import type { WorkOrderDetail } from '../types';

/** Spare parts of the job: reserve from stock, record usage, or release. */
export function MaterialsPanel({ workOrder }: { workOrder: WorkOrderDetail }) {
  const canEdit = workOrder.availableActions.includes('ADD_MATERIAL');
  const items = useInventoryItemOptions(canEdit);
  const [itemId, setItemId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  const add = useWorkOrderMutation(({ id, qty }: { id: string; qty: number }) => workOrdersApi.addMaterial(workOrder.id, id, qty));
  const consume = useWorkOrderMutation((materialId: string) => workOrdersApi.consumeMaterial(workOrder.id, materialId));
  const release = useWorkOrderMutation((materialId: string) => workOrdersApi.releaseMaterial(workOrder.id, materialId));

  const submit = () =>
    itemId &&
    add.mutate(
      { id: itemId, qty: quantity },
      {
        onSuccess: (materials) => {
          const added = materials[materials.length - 1];
          if (added?.status === 'SHORTAGE') {
            notify.success('Not enough stock: the work order is blocked and a procurement request was sent for approval.', 'Shortage recorded');
          } else {
            notify.success('Parts reserved');
          }
          setItemId(null);
          setQuantity(1);
        },
        onError: (error) => notify.error(error),
      },
    );

  return (
    <Stack>
      {workOrder.materials.length === 0 ? (
        <Text size="sm" c="dimmed">
          No spare parts recorded.
        </Text>
      ) : (
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Item</Table.Th>
              <Table.Th>Qty</Table.Th>
              <Table.Th>Status</Table.Th>
              {canEdit && <Table.Th />}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {workOrder.materials.map((m) => (
              <Table.Tr key={m.id}>
                <Table.Td>
                  <Text size="sm">{m.item.name}</Text>
                  <Text size="xs" c="dimmed">
                    {m.item.sku}
                  </Text>
                </Table.Td>
                <Table.Td>
                  {m.quantity} {m.item.unit}
                </Table.Td>
                <Table.Td>
                  <StatusBadge value={m.status} />
                </Table.Td>
                {canEdit && (
                  <Table.Td>
                    <Group gap="xs" justify="flex-end">
                      {m.status === 'RESERVED' && (
                        <Button size="xs" variant="light" loading={consume.isPending && consume.variables === m.id} onClick={() => consume.mutate(m.id, { onSuccess: () => notify.success('Usage recorded'), onError: (error) => notify.error(error) })}>
                          Mark used
                        </Button>
                      )}
                      {(m.status === 'RESERVED' || m.status === 'SHORTAGE') && (
                        <Button size="xs" variant="subtle" color="gray" loading={release.isPending && release.variables === m.id} onClick={() => release.mutate(m.id, { onSuccess: () => notify.success('Released'), onError: (error) => notify.error(error) })}>
                          Release
                        </Button>
                      )}
                    </Group>
                  </Table.Td>
                )}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      {canEdit && (
        <Group align="flex-end" gap="sm">
          <Select
            label="Add spare part"
            placeholder="Search by name or SKU"
            searchable
            style={{ flex: 1 }}
            data={(items.data ?? []).map((i) => ({ value: i.id, label: `${i.name} (${i.sku}) – ${i.availableQuantity} ${i.unit} available` }))}
            value={itemId}
            onChange={setItemId}
          />
          <NumberInput label="Quantity" min={1} max={1000} w={100} value={quantity} onChange={(v) => setQuantity(typeof v === 'number' ? v : 1)} />
          <Button leftSection={<IconPlus size={14} />} disabled={!itemId} loading={add.isPending} onClick={submit}>
            Add
          </Button>
        </Group>
      )}
    </Stack>
  );
}
