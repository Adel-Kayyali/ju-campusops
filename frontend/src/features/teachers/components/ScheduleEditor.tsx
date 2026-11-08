import { ActionIcon, Button, Group, Paper, Select, Stack, Table, Text, TextInput, Title } from '@mantine/core';
import { TimeInput } from '@mantine/dates';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { SCHEDULE_ENTRY_TYPES, WEEKDAYS, type ScheduleEntryType, type Weekday } from '@/shared/types/enums';
import { enumLabel } from '@/shared/utils/labels';
import { notify } from '@/shared/utils/notify';
import { teachersApi, useMyTeacherMutation } from '../api';
import type { ScheduleEntryInput, TeacherDetail } from '../types';

interface Row extends ScheduleEntryInput {
  key: string;
}

let counter = 0;
const newKey = () => `row-${++counter}`;

const blank = (type: ScheduleEntryType): Row => ({
  key: newKey(),
  type,
  weekday: 'SUNDAY',
  startTime: type === 'LECTURE' ? '08:30' : '11:00',
  endTime: type === 'LECTURE' ? '10:00' : '12:00',
  title: type === 'LECTURE' ? '' : 'Office hours',
  location: '',
});

/**
 * Edits the whole weekly timetable (lectures + office hours) and saves it in one go.
 * The API checks the times and rejects overlapping slots with a clear message.
 */
export function ScheduleEditor({ teacher }: { teacher: TeacherDetail }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [dirty, setDirty] = useState(false);
  const save = useMyTeacherMutation(teachersApi.replaceMySchedule);

  useEffect(() => {
    setRows(teacher.schedule.map(({ id, location, ...entry }) => ({ ...entry, location: location ?? '', key: id })));
    setDirty(false);
  }, [teacher.schedule]);

  const update = (key: string, patch: Partial<Row>) => {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));
    setDirty(true);
  };
  const add = (type: ScheduleEntryType) => {
    setRows((current) => [...current, blank(type)]);
    setDirty(true);
  };
  const remove = (key: string) => {
    setRows((current) => current.filter((row) => row.key !== key));
    setDirty(true);
  };

  const submit = () =>
    save.mutate(
      rows.map(({ key: _key, location, ...entry }) => ({ ...entry, title: entry.title.trim() || (entry.type === 'OFFICE_HOUR' ? 'Office hours' : ''), location: location?.trim() || undefined })),
      { onSuccess: () => notify.success('Your timetable was saved'), onError: (error) => notify.error(error) },
    );

  const sorted = [...rows].sort((a, b) => WEEKDAYS.indexOf(a.weekday) - WEEKDAYS.indexOf(b.weekday) || a.startTime.localeCompare(b.startTime));

  return (
    <Paper withBorder radius="md" p="md">
      <Group justify="space-between" mb="sm" wrap="wrap">
        <div>
          <Title order={4}>My weekly timetable</Title>
          <Text size="sm" c="dimmed">
            Your lectures and office hours. Times use the 24-hour clock.
          </Text>
        </div>
        <Group gap="xs">
          <Button size="xs" variant="light" leftSection={<IconPlus size={14} />} onClick={() => add('LECTURE')}>
            Add lecture
          </Button>
          <Button size="xs" variant="light" color="teal" leftSection={<IconPlus size={14} />} onClick={() => add('OFFICE_HOUR')}>
            Add office hours
          </Button>
        </Group>
      </Group>

      {rows.length === 0 ? (
        <Text size="sm" c="dimmed" ta="center" py="lg">
          No lectures or office hours yet. Use the buttons above to add them.
        </Text>
      ) : (
        <Table.ScrollContainer minWidth={820}>
          <Table verticalSpacing={6}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th w={140}>Type</Table.Th>
                <Table.Th w={140}>Day</Table.Th>
                <Table.Th w={100}>From</Table.Th>
                <Table.Th w={100}>To</Table.Th>
                <Table.Th>Course / description</Table.Th>
                <Table.Th w={150}>Room</Table.Th>
                <Table.Th w={40} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sorted.map((row) => (
                <Table.Tr key={row.key}>
                  <Table.Td>
                    <Select size="xs" allowDeselect={false} data={SCHEDULE_ENTRY_TYPES.map((t) => ({ value: t, label: t === 'OFFICE_HOUR' ? 'Office hours' : 'Lecture' }))} value={row.type} onChange={(v) => update(row.key, { type: v as ScheduleEntryType })} />
                  </Table.Td>
                  <Table.Td>
                    <Select size="xs" allowDeselect={false} data={WEEKDAYS.map((d) => ({ value: d, label: enumLabel(d) }))} value={row.weekday} onChange={(v) => update(row.key, { weekday: v as Weekday })} />
                  </Table.Td>
                  <Table.Td>
                    <TimeInput size="xs" value={row.startTime} onChange={(e) => update(row.key, { startTime: e.currentTarget.value.slice(0, 5) })} />
                  </Table.Td>
                  <Table.Td>
                    <TimeInput size="xs" value={row.endTime} onChange={(e) => update(row.key, { endTime: e.currentTarget.value.slice(0, 5) })} />
                  </Table.Td>
                  <Table.Td>
                    <TextInput size="xs" placeholder={row.type === 'LECTURE' ? 'e.g. Software Engineering (Section 1)' : 'Office hours'} value={row.title} onChange={(e) => update(row.key, { title: e.currentTarget.value })} />
                  </Table.Td>
                  <Table.Td>
                    <TextInput size="xs" placeholder="e.g. ITC 201" value={row.location ?? ''} onChange={(e) => update(row.key, { location: e.currentTarget.value })} />
                  </Table.Td>
                  <Table.Td>
                    <ActionIcon variant="subtle" color="red" aria-label="Remove" onClick={() => remove(row.key)}>
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}
      <Stack align="flex-end" mt="md">
        <Button onClick={submit} loading={save.isPending} disabled={!dirty}>
          Save timetable
        </Button>
      </Stack>
    </Paper>
  );
}
