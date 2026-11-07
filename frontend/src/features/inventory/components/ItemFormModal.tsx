import { Button, Group, Modal, NumberInput, SimpleGrid, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';
import { notify } from '@/shared/utils/notify';
import { inventoryApi, useInventoryMutation } from '../api';
import type { InventoryItem, InventoryItemInput } from '../types';

type FormValues = Required<Omit<InventoryItemInput, 'storageLocation'>> & { storageLocation: string };
const EMPTY: FormValues = { sku: '', name: '', category: '', unit: 'pcs', quantityOnHand: 0, reorderLevel: 5, unitCost: 0, storageLocation: '' };

/** Creates a spare part, or edits its catalogue data (stock is changed through adjustments). */
export function ItemFormModal({ opened, item, onClose }: { opened: boolean; item?: InventoryItem | null; onClose: () => void }) {
  const isEdit = Boolean(item);
  const form = useForm<FormValues>({
    initialValues: EMPTY,
    validate: {
      sku: (v) => (isEdit || /^[A-Za-z0-9-]{2,30}$/.test(v) ? null : '2-30 letters, digits or dashes'),
      name: (v) => (v.trim() ? null : 'Required'),
      category: (v) => (v.trim() ? null : 'Required'),
    },
  });

  useEffect(() => {
    if (!opened) return;
    form.setValues(
      item
        ? { sku: item.sku, name: item.name, category: item.category, unit: item.unit, quantityOnHand: item.quantityOnHand, reorderLevel: item.reorderLevel, unitCost: item.unitCost, storageLocation: item.storageLocation ?? '' }
        : EMPTY,
    );
  }, [opened, item]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useInventoryMutation((v: FormValues) => {
    const common = { name: v.name.trim(), category: v.category.trim(), unit: v.unit.trim() || 'pcs', reorderLevel: v.reorderLevel, unitCost: v.unitCost, storageLocation: v.storageLocation.trim() || undefined };
    return item ? inventoryApi.update(item.id, common) : inventoryApi.create({ ...common, sku: v.sku, quantityOnHand: v.quantityOnHand });
  });

  return (
    <Modal opened={opened} onClose={onClose} title={isEdit ? `Edit ${item?.sku}` : 'New inventory item'} centered>
      <form
        onSubmit={form.onSubmit((values) =>
          save.mutate(values, {
            onSuccess: () => {
              notify.success(isEdit ? 'Item updated' : 'Item created');
              onClose();
            },
            onError: notify.error,
          }),
        )}
      >
        <Stack>
          <SimpleGrid cols={2}>
            <TextInput label="SKU" disabled={isEdit} {...form.getInputProps('sku')} />
            <TextInput label="Category" placeholder="Electrical" {...form.getInputProps('category')} />
          </SimpleGrid>
          <TextInput label="Name" {...form.getInputProps('name')} />
          <SimpleGrid cols={2}>
            <TextInput label="Unit" {...form.getInputProps('unit')} />
            {!isEdit && <NumberInput label="Initial quantity" min={0} {...form.getInputProps('quantityOnHand')} />}
            <NumberInput label="Reorder level" min={0} {...form.getInputProps('reorderLevel')} />
            <NumberInput label="Unit cost (JOD)" min={0} decimalScale={2} {...form.getInputProps('unitCost')} />
          </SimpleGrid>
          <TextInput label="Storage location" {...form.getInputProps('storageLocation')} />
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={save.isPending}>
              Save
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
