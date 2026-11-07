import { Button, Group, Modal, Select, SimpleGrid, Stack, Textarea, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';
import { buildingOptions, useBuildings, useRooms } from '@/features/locations/api';
import { ASSET_STATUSES, ASSET_TYPES, type AssetStatus, type AssetType } from '@/shared/types/enums';
import { toOptions } from '@/shared/utils/labels';
import { notify } from '@/shared/utils/notify';
import { assetsApi, useAssetMutation } from '../api';
import type { Asset, AssetInput } from '../types';

interface FormValues {
  code: string;
  name: string;
  type: AssetType;
  status: AssetStatus;
  buildingId: string;
  roomId: string | null;
  manufacturer: string;
  model: string;
  serialNumber: string;
  installDate: string | null;
  warrantyExpiry: string | null;
  notes: string;
}

const EMPTY: FormValues = { code: '', name: '', type: 'OTHER', status: 'OPERATIONAL', buildingId: '', roomId: null, manufacturer: '', model: '', serialNumber: '', installDate: null, warrantyExpiry: null, notes: '' };

/** Creates or edits an asset of the facilities registry. */
export function AssetFormModal({ opened, asset, onClose }: { opened: boolean; asset?: Asset | null; onClose: () => void }) {
  const isEdit = Boolean(asset);
  const buildings = useBuildings();
  const form = useForm<FormValues>({
    initialValues: EMPTY,
    validate: {
      code: (v) => (isEdit || /^[A-Za-z0-9-]{2,30}$/.test(v) ? null : '2-30 letters, digits or dashes'),
      name: (v) => (v.trim() ? null : 'Required'),
      buildingId: (v) => (v ? null : 'Choose a building'),
    },
  });
  const rooms = useRooms(form.values.buildingId || null);

  useEffect(() => {
    if (!opened) return;
    form.setValues(
      asset
        ? {
            code: asset.code,
            name: asset.name,
            type: asset.type,
            status: asset.status,
            buildingId: asset.building.id,
            roomId: asset.room?.id ?? null,
            manufacturer: asset.manufacturer ?? '',
            model: asset.model ?? '',
            serialNumber: asset.serialNumber ?? '',
            installDate: asset.installDate,
            warrantyExpiry: asset.warrantyExpiry,
            notes: asset.notes ?? '',
          }
        : EMPTY,
    );
  }, [opened, asset]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useAssetMutation((values: FormValues) => {
    const input: AssetInput = {
      code: values.code,
      name: values.name.trim(),
      type: values.type,
      buildingId: values.buildingId,
      roomId: values.roomId,
      manufacturer: values.manufacturer.trim() || undefined,
      model: values.model.trim() || undefined,
      serialNumber: values.serialNumber.trim() || undefined,
      installDate: values.installDate ?? undefined,
      warrantyExpiry: values.warrantyExpiry ?? undefined,
      notes: values.notes.trim() || undefined,
    };
    if (asset) {
      const { code: _code, ...update } = input;
      return assetsApi.update(asset.id, { ...update, status: values.status });
    }
    return assetsApi.create({ ...input, roomId: input.roomId ?? undefined });
  });

  return (
    <Modal opened={opened} onClose={onClose} title={isEdit ? `Edit asset ${asset?.code}` : 'New asset'} size="lg" centered>
      <form
        onSubmit={form.onSubmit((values) =>
          save.mutate(values, {
            onSuccess: () => {
              notify.success(isEdit ? 'Asset updated' : 'Asset created');
              onClose();
            },
            onError: notify.error,
          }),
        )}
      >
        <Stack>
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput label="Code" placeholder="HVAC-ENG-02" disabled={isEdit} {...form.getInputProps('code')} />
            <TextInput label="Name" {...form.getInputProps('name')} />
            <Select label="Type" data={toOptions(ASSET_TYPES)} allowDeselect={false} value={form.values.type} onChange={(v) => form.setFieldValue('type', v as AssetType)} />
            {isEdit && <Select label="Status" data={toOptions(ASSET_STATUSES)} allowDeselect={false} value={form.values.status} onChange={(v) => form.setFieldValue('status', v as AssetStatus)} />}
            <Select
              label="Building"
              data={buildingOptions(buildings.data)}
              value={form.values.buildingId || null}
              onChange={(v) => {
                form.setFieldValue('buildingId', v ?? '');
                form.setFieldValue('roomId', null);
              }}
              error={form.errors.buildingId}
            />
            <Select
              label="Room"
              placeholder="Optional"
              clearable
              disabled={!form.values.buildingId}
              data={(rooms.data ?? []).map((r) => ({ value: r.id, label: `${r.code} – ${r.name}` }))}
              value={form.values.roomId}
              onChange={(v) => form.setFieldValue('roomId', v)}
            />
            <TextInput label="Manufacturer" {...form.getInputProps('manufacturer')} />
            <TextInput label="Model" {...form.getInputProps('model')} />
            <TextInput label="Serial number" {...form.getInputProps('serialNumber')} />
            <DateInput label="Install date" valueFormat="DD MMM YYYY" clearable {...form.getInputProps('installDate')} />
            <DateInput label="Warranty expiry" valueFormat="DD MMM YYYY" clearable {...form.getInputProps('warrantyExpiry')} />
          </SimpleGrid>
          <Textarea label="Notes" autosize minRows={2} {...form.getInputProps('notes')} />
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
