import { Avatar, Badge, Group, Paper, Stack, Text } from '@mantine/core';
import { IconMail, IconMapPin, IconPhone } from '@tabler/icons-react';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { displayName, type Teacher } from '../types';
import { ScheduleEntryLine } from './WeeklyTimetable';

export function TeacherCard({ teacher, onOpen }: { teacher: Teacher; onOpen: () => void }) {
  const initials = teacher.fullName.split(' ').map((part) => part[0]).slice(0, 2).join('');
  const activity = teacher.currentActivity;
  return (
    <Paper withBorder radius="md" p="md" onClick={onOpen} style={{ cursor: 'pointer', borderTop: `4px solid var(--mantine-color-${teacher.status === 'FREE' ? 'green' : 'red'}-6)` }}>
      <Stack gap="sm">
        <Group justify="space-between" wrap="nowrap" align="flex-start">
          <Group gap="sm" wrap="nowrap">
            <Avatar color="grape" radius="xl">
              {initials}
            </Avatar>
            <div>
              <Text fw={700} lh={1.2}>
                {displayName(teacher)}
              </Text>
              <Text size="xs" c="dimmed">
                {teacher.department ?? '—'}
              </Text>
            </div>
          </Group>
          <StatusBadge value={teacher.status} size="lg" variant="filled" />
        </Group>

        {activity && (
          <Badge variant="light" color={activity.type === 'OFFICE_HOUR' ? 'teal' : 'blue'} size="sm" style={{ alignSelf: 'flex-start' }}>
            Now: {activity.type === 'OFFICE_HOUR' ? 'office hours' : activity.title} until {activity.endTime}
          </Badge>
        )}

        <Stack gap={2}>
          {teacher.officeLocation && <Info icon={<IconMapPin size={14} />} text={teacher.officeLocation} />}
          <Info icon={<IconMail size={14} />} text={teacher.email} />
          {teacher.phone && <Info icon={<IconPhone size={14} />} text={teacher.phone} />}
        </Stack>

        <div>
          <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb={2}>
            Today
          </Text>
          {teacher.today.length === 0 ? (
            <Text size="xs" c="dimmed">
              No lectures or office hours today
            </Text>
          ) : (
            teacher.today.map((entry) => <ScheduleEntryLine key={entry.id} entry={entry} highlight={entry.id === activity?.id} />)
          )}
        </div>
      </Stack>
    </Paper>
  );
}

function Info({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <Group gap={6} wrap="nowrap">
      {icon}
      <Text size="xs" lineClamp={1}>
        {text}
      </Text>
    </Group>
  );
}
