import { Button, Group, Modal, NumberInput, Select, SimpleGrid, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';
import { buildingOptions, useBuildings } from '@/features/locations/api';
import { LOCKER_SIZES, type LockerSize } from '@/shared/types/enums';
import { toOptions } from '@/shared/utils/labels';
import { notify } from '@/shared/utils/notify';
import { lockersApi, useLockerMutation } from '../api';
import type { Locker, LockerInput } from '../types';

interface LockerFormModalProps {
  opened: boolean;
  locker?: Locker | null;
  onClose: () => void;
}

/** Creates a new locker, or edits floor / zone / size / fee of an existing one. */
export function LockerFormModal({ opened, locker, onClose }: LockerFormModalProps) {
  const buildings = useBuildings();
  const isEdit = Boolean(locker);
  const form = useForm<LockerInput>({
    initialValues: { code: '', buildingId: '', floor: 0, zone: '', size: 'MEDIUM', monthlyFee: 7.5 },
    validate: {
      code: (v) => (isEdit || /^[A-Za-z0-9-]{2,20}$/.test(v) ? null : '2-20 letters, digits or dashes'),
      buildingId: (v) => (v ? null : 'Choose a building'),
      zone: (v) => (v.trim() ? null : 'Required'),
      monthlyFee: (v) => (v >= 0 ? null : 'Must be positive'),
    },
  });

  useEffect(() => {
    if (opened) {
      form.setValues(locker ? { code: locker.code, buildingId: locker.building.id, floor: locker.floor, zone: locker.zone, size: locker.size, monthlyFee: locker.monthlyFee } : { code: '', buildingId: '', floor: 0, zone: '', size: 'MEDIUM', monthlyFee: 7.5 });
      form.resetDirty();
    }
  }, [opened, locker]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useLockerMutation((values: LockerInput) =>
    locker ? lockersApi.update(locker.id, { floor: values.floor, zone: values.zone, size: values.size, monthlyFee: values.monthlyFee }) : lockersApi.create(values),
  );

  return (
    <Modal opened={opened} onClose={onClose} title={isEdit ? `Edit locker ${locker?.code}` : 'New locker'} centered>
      <form
        onSubmit={form.onSubmit((values) =>
          save.mutate(values, {
            onSuccess: () => {
              notify.success(isEdit ? 'Locker updated' : 'Locker created');
              onClose();
            },
            onError: (error) => notify.error(error),
          }),
        )}
      >
        <Stack>
          <TextInput label="Code" placeholder="ENG-1A-31" disabled={isEdit} {...form.getInputProps('code')} />
          <Select label="Building" data={buildingOptions(buildings.data)} disabled={isEdit} {...form.getInputProps('buildingId')} />
          <SimpleGrid cols={2}>
            <NumberInput label="Floor" min={-5} max={50} {...form.getInputProps('floor')} />
            <TextInput label="Zone" placeholder="A" {...form.getInputProps('zone')} />
            <Select label="Size" data={toOptions(LOCKER_SIZES)} allowDeselect={false} value={form.values.size} onChange={(v) => form.setFieldValue('size', v as LockerSize)} />
            <NumberInput label="Monthly fee (JOD)" min={0} decimalScale={2} {...form.getInputProps('monthlyFee')} />
          </SimpleGrid>
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
