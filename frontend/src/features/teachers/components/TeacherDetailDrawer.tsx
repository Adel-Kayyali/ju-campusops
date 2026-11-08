import { Alert, Drawer, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { DetailItem } from '@/shared/components/DetailItem';
import { QueryState } from '@/shared/components/QueryState';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { formatRelative } from '@/shared/utils/format';
import { useTeacher } from '../api';
import { displayName } from '../types';
import { WeeklyTimetable } from './WeeklyTimetable';

export function TeacherDetailDrawer({ teacherId, onClose }: { teacherId: string | null; onClose: () => void }) {
  const teacher = useTeacher(teacherId);
  return (
    <Drawer opened={teacherId !== null} onClose={onClose} position="right" size="xl" title={<Text fw={700} size="lg">Teacher</Text>}>
      <QueryState query={teacher}>
        {(t) => (
          <Stack>
            <Group justify="space-between">
              <div>
                <Title order={3}>{displayName(t)}</Title>
                <Text c="dimmed">{t.department ?? '—'}</Text>
              </div>
              <Stack gap={2} align="flex-end">
                <StatusBadge value={t.status} size="xl" variant="filled" />
                <Text size="xs" c="dimmed">
                  since {formatRelative(t.statusChangedAt)}
                </Text>
              </Stack>
            </Group>
            {t.currentActivity && (
              <Alert variant="light" color={t.currentActivity.type === 'OFFICE_HOUR' ? 'teal' : 'blue'}>
                Right now: {t.currentActivity.type === 'OFFICE_HOUR' ? 'office hours' : t.currentActivity.title} ({t.currentActivity.startTime}–{t.currentActivity.endTime}
                {t.currentActivity.location ? `, ${t.currentActivity.location}` : ''})
              </Alert>
            )}
            <SimpleGrid cols={{ base: 1, sm: 3 }}>
              <DetailItem label="Office">{t.officeLocation ?? '—'}</DetailItem>
              <DetailItem label="E-mail">{t.email}</DetailItem>
              <DetailItem label="Phone">{t.phone ?? '—'}</DetailItem>
            </SimpleGrid>
            <Title order={5} mt="sm">
              Weekly timetable
            </Title>
            <WeeklyTimetable schedule={t.schedule} currentId={t.currentActivity?.id} narrow />
          </Stack>
        )}
      </QueryState>
    </Drawer>
  );
}
