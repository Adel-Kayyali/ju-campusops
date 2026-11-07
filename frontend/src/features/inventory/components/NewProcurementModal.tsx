import { Button, Group, Modal, NumberInput, Select, Stack, Textarea } from '@mantine/core';
import { useEffect, useState } from 'react';
import { notify } from '@/shared/utils/notify';
import { inventoryApi, useInventoryItems, useInventoryMutation } from '../api';

/** Asks managers to buy spare parts. */
export function NewProcurementModal({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const items = useInventoryItems({});
  const [itemId, setItemId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [reason, setReason] = useState('');
  useEffect(() => {
    if (opened) {
      setItemId(null);
      setQuantity(1);
      setReason('');
    }
  }, [opened]);

  const create = useInventoryMutation(inventoryApi.createProcurement);
  const valid = Boolean(itemId) && typeof quantity === 'number' && quantity > 0 && reason.trim().length > 0;

  return (
    <Modal opened={opened} onClose={onClose} title="New procurement request" centered>
      <Stack>
        <Select label="Item" searchable data={(items.data ?? []).map((i) => ({ value: i.id, label: `${i.sku} – ${i.name} (available ${i.availableQuantity})` }))} value={itemId} onChange={setItemId} />
        <NumberInput label="Quantity" min={1} value={quantity} onChange={(v) => setQuantity(typeof v === 'number' ? v : '')} />
        <Textarea label="Reason" autosize minRows={2} value={reason} onChange={(e) => setReason(e.currentTarget.value)} />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!valid}
            loading={create.isPending}
            onClick={() =>
              create.mutate(
                { itemId: itemId!, quantity: quantity as number, reason: reason.trim() },
                {
                  onSuccess: (p) => {
                    notify.success(`Procurement ${p.code} sent for approval`);
                    onClose();
                  },
                  onError: notify.error,
                },
              )
            }
          >
            Submit
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
