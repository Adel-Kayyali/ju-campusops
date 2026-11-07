import { Button, Checkbox, Group, Modal, Select, Stack, Textarea, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { technicianOptions, useTechnicians } from '@/features/technicians/api';
import { PRIORITIES, type Priority } from '@/shared/types/enums';
import { toOptions } from '@/shared/utils/labels';
import { notify } from '@/shared/utils/notify';
import { assetsApi, useAssetMutation } from '../api';
import type { Asset } from '../types';

interface FormValues {
  title: string;
  description: string;
  priority: Priority;
  technicianId: string | null;
  requiresMaterialApproval: boolean;
}

/** Opens a corrective work order directly on an asset (no service request needed). */
export function AssetWorkOrderModal({ asset, onClose }: { asset: Asset | null; onClose: () => void }) {
  const navigate = useNavigate();
  const technicians = useTechnicians(asset !== null);
  const form = useForm<FormValues>({
    initialValues: { title: '', description: '', priority: 'P3', technicianId: null, requiresMaterialApproval: false },
    validate: { title: (v) => (v.trim().length >= 5 ? null : 'At least 5 characters') },
  });

  useEffect(() => {
    if (asset) form.setValues({ title: `Repair ${asset.name}`, description: '', priority: 'P3', technicianId: null, requiresMaterialApproval: false });
  }, [asset]); // eslint-disable-line react-hooks/exhaustive-deps

  const create = useAssetMutation((values: FormValues) =>
    assetsApi.createWorkOrder({
      assetId: asset!.id,
      title: values.title.trim(),
      description: values.description.trim() || undefined,
      priority: values.priority,
      technicianId: values.technicianId ?? undefined,
      requiresMaterialApproval: values.requiresMaterialApproval,
    }),
  );

  return (
    <Modal opened={asset !== null} onClose={onClose} title={`New work order – ${asset?.code ?? ''}`} centered>
      <form
        onSubmit={form.onSubmit((values) =>
          create.mutate(values, {
            onSuccess: (workOrder) => {
              notify.success(`Work order ${workOrder.code} created`);
              onClose();
              navigate(`/work-orders/${workOrder.id}`);
            },
            onError: notify.error,
          }),
        )}
      >
        <Stack>
          <TextInput label="Title" {...form.getInputProps('title')} />
          <Textarea label="Description" autosize minRows={2} {...form.getInputProps('description')} />
          <Select label="Priority" data={toOptions(PRIORITIES)} allowDeselect={false} value={form.values.priority} onChange={(v) => form.setFieldValue('priority', v as Priority)} />
          <Select label="Technician" placeholder="Assign later" clearable searchable data={technicianOptions(technicians.data)} value={form.values.technicianId} onChange={(v) => form.setFieldValue('technicianId', v)} />
          <Checkbox label="Materials need manager approval before the repair" {...form.getInputProps('requiresMaterialApproval', { type: 'checkbox' })} />
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={create.isPending}>
              Create work order
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
