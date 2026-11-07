import { Button, Group, Modal, NumberInput, Select, SimpleGrid, Stack, Textarea, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';
import { useAllAssets } from '@/features/assets/api';
import { technicianOptions, useTechnicians } from '@/features/technicians/api';
import { INTERVAL_UNITS, PRIORITIES, type IntervalUnit, type Priority } from '@/shared/types/enums';
import { toOptions } from '@/shared/utils/labels';
import { notify } from '@/shared/utils/notify';
import { schedulesApi, useScheduleMutation } from '../api';
import type { Schedule } from '../types';

interface FormValues {
  assetId: string;
  title: string;
  description: string;
  intervalValue: number;
  intervalUnit: IntervalUnit;
  nextDueDate: string | null;
  leadDays: number;
  priority: Priority;
  defaultTechnicianId: string | null;
}

const EMPTY: FormValues = { assetId: '', title: '', description: '', intervalValue: 1, intervalUnit: 'MONTHS', nextDueDate: null, leadDays: 7, priority: 'P3', defaultTechnicianId: null };

/** Creates or edits a recurring preventive maintenance schedule. */
export function ScheduleFormModal({ opened, schedule, onClose }: { opened: boolean; schedule?: Schedule | null; onClose: () => void }) {
  const isEdit = Boolean(schedule);
  const assets = useAllAssets();
  const technicians = useTechnicians(opened);
  const form = useForm<FormValues>({
    initialValues: EMPTY,
    validate: {
      assetId: (v) => (v ? null : 'Choose an asset'),
      title: (v) => (v.trim() ? null : 'Required'),
      nextDueDate: (v) => (v ? null : 'Required'),
      intervalValue: (v) => (v >= 1 ? null : 'At least 1'),
    },
  });

  useEffect(() => {
    if (!opened) return;
    form.setValues(
      schedule
        ? {
            assetId: schedule.asset.id,
            title: schedule.title,
            description: schedule.description ?? '',
            intervalValue: schedule.intervalValue,
            intervalUnit: schedule.intervalUnit,
            nextDueDate: schedule.nextDueDate,
            leadDays: schedule.leadDays,
            priority: schedule.priority,
            defaultTechnicianId: schedule.defaultTechnicianId,
          }
        : EMPTY,
    );
  }, [opened, schedule]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useScheduleMutation((v: FormValues) => {
    const common = {
      title: v.title.trim(),
      description: v.description.trim() || undefined,
      intervalValue: v.intervalValue,
      intervalUnit: v.intervalUnit,
      nextDueDate: v.nextDueDate!,
      leadDays: v.leadDays,
      priority: v.priority,
    };
    return schedule
      ? schedulesApi.update(schedule.id, { ...common, defaultTechnicianId: v.defaultTechnicianId })
      : schedulesApi.create({ ...common, assetId: v.assetId, defaultTechnicianId: v.defaultTechnicianId ?? undefined });
  });

  return (
    <Modal opened={opened} onClose={onClose} title={isEdit ? 'Edit schedule' : 'New preventive schedule'} size="lg" centered>
      <form
        onSubmit={form.onSubmit((values) =>
          save.mutate(values, {
            onSuccess: () => {
              notify.success(isEdit ? 'Schedule updated' : 'Schedule created');
              onClose();
            },
            onError: notify.error,
          }),
        )}
      >
        <Stack>
          <Select
            label="Asset"
            searchable
            disabled={isEdit}
            data={(assets.data?.content ?? []).map((a) => ({ value: a.id, label: `${a.code} – ${a.name}` }))}
            value={form.values.assetId || null}
            onChange={(v) => form.setFieldValue('assetId', v ?? '')}
            error={form.errors.assetId}
          />
          <TextInput label="Title" placeholder="Monthly elevator safety inspection" {...form.getInputProps('title')} />
          <Textarea label="Instructions" autosize minRows={2} {...form.getInputProps('description')} />
          <SimpleGrid cols={{ base: 1, sm: 3 }}>
            <NumberInput label="Every" min={1} max={365} {...form.getInputProps('intervalValue')} />
            <Select label="Unit" data={toOptions(INTERVAL_UNITS)} allowDeselect={false} value={form.values.intervalUnit} onChange={(v) => form.setFieldValue('intervalUnit', v as IntervalUnit)} />
            <DateInput label="Next due date" valueFormat="DD MMM YYYY" {...form.getInputProps('nextDueDate')} />
            <NumberInput label="Create work (days before)" min={0} max={60} {...form.getInputProps('leadDays')} />
            <Select label="Priority" data={toOptions(PRIORITIES)} allowDeselect={false} value={form.values.priority} onChange={(v) => form.setFieldValue('priority', v as Priority)} />
            <Select label="Default technician" clearable searchable data={technicianOptions(technicians.data)} value={form.values.defaultTechnicianId} onChange={(v) => form.setFieldValue('defaultTechnicianId', v)} />
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
