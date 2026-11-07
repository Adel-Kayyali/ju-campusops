import { Button, Group, Modal, NumberInput, SegmentedControl, Stack, Text, Textarea } from '@mantine/core';
import { useEffect, useState } from 'react';
import { notify } from '@/shared/utils/notify';
import { inventoryApi, useInventoryMutation } from '../api';
import type { AdjustStockInput, InventoryItem } from '../types';

/** Goods received (IN, positive) or stock-count correction (ADJUSTMENT, + or -). */
export function AdjustStockModal({ item, onClose }: { item: InventoryItem | null; onClose: () => void }) {
  const [type, setType] = useState<AdjustStockInput['type']>('IN');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [note, setNote] = useState('');
  useEffect(() => {
    if (item) {
      setType('IN');
      setQuantity('');
      setNote('');
    }
  }, [item]);

  const adjust = useInventoryMutation((input: AdjustStockInput) => inventoryApi.adjust(item!.id, input));
  const valid = typeof quantity === 'number' && quantity !== 0 && (type === 'ADJUSTMENT' || quantity > 0) && note.trim().length > 0;

  return (
    <Modal opened={item !== null} onClose={onClose} title={`Adjust stock – ${item?.name ?? ''}`} centered>
      <Stack>
        <Text size="sm">
          On hand: <b>{item?.quantityOnHand}</b> {item?.unit} • reserved: {item?.reservedQuantity}
        </Text>
        <SegmentedControl
          fullWidth
          value={type}
          onChange={(v) => setType(v as AdjustStockInput['type'])}
          data={[
            { value: 'IN', label: 'Goods received' },
            { value: 'ADJUSTMENT', label: 'Stock-count correction' },
          ]}
        />
        <NumberInput label={type === 'IN' ? 'Quantity received' : 'Correction (+ or -)'} allowNegative={type === 'ADJUSTMENT'} value={quantity} onChange={(v) => setQuantity(typeof v === 'number' ? v : '')} />
        <Textarea label="Note" required autosize minRows={2} value={note} onChange={(e) => setNote(e.currentTarget.value)} />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!valid}
            loading={adjust.isPending}
            onClick={() =>
              adjust.mutate(
                { type, quantity: quantity as number, note: note.trim() },
                {
                  onSuccess: () => {
                    notify.success('Stock updated');
                    onClose();
                  },
                  onError: notify.error,
                },
              )
            }
          >
            Save
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
