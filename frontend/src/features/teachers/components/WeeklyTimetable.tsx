import { Badge, Group, Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import { WEEKDAYS, type Weekday } from '@/shared/types/enums';
import { enumLabel, statusColor } from '@/shared/utils/labels';
import type { ScheduleEntry } from '../types';

/** Working days of the University of Jordan; Friday/Saturday are shown only when used. */
const WORKING_DAYS: Weekday[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY'];

export function ScheduleEntryLine({ entry, highlight = false }: { entry: ScheduleEntry; highlight?: boolean }) {
  const isOfficeHour = entry.type === 'OFFICE_HOUR';
  return (
    <Stack gap={2} p={6} style={{ borderRadius: 6, background: highlight ? 'var(--mantine-color-yellow-light)' : undefined }}>
      <Group gap={6} wrap="nowrap" justify="space-between">
        <Text size="xs" fw={700}>
          {entry.startTime}–{entry.endTime}
        </Text>
        <Badge size="xs" variant="light" color={statusColor(entry.type)} style={{ flexShrink: 0 }}>
          {isOfficeHour ? 'Office hours' : 'Lecture'}
        </Badge>
      </Group>
      {!isOfficeHour && (
        <Text size="xs" fw={500} lineClamp={2}>
          {entry.title}
        </Text>
      )}
      {entry.location && (
        <Text size="xs" c="dimmed">
          {entry.location}
        </Text>
      )}
    </Stack>
  );
}

/** The whole week, one column per day. */
export function WeeklyTimetable({ schedule, currentId, narrow = false }: { schedule: ScheduleEntry[]; currentId?: string | null; /** Fewer columns, for drawers. */ narrow?: boolean }) {
  const days = WEEKDAYS.filter((day) => WORKING_DAYS.includes(day) || schedule.some((entry) => entry.weekday === day));
  const today = WEEKDAYS[new Date().getDay()];
  return (
    <SimpleGrid cols={narrow ? { base: 1, sm: 2, lg: 3 } : { base: 1, sm: 2, md: days.length > 5 ? 4 : 5 }} spacing="sm">
      {days.map((day) => {
        const entries = schedule.filter((entry) => entry.weekday === day);
        return (
          <Paper key={day} withBorder radius="md" p="xs" style={{ borderColor: day === today ? 'var(--mantine-color-blue-5)' : undefined }}>
            <Text fw={700} size="sm" mb={6} c={day === today ? 'blue' : undefined}>
              {enumLabel(day)} {day === today && '(today)'}
            </Text>
            <Stack gap={4}>
              {entries.length === 0 ? (
                <Text size="xs" c="dimmed">
                  Nothing scheduled
                </Text>
              ) : (
                entries.map((entry) => <ScheduleEntryLine key={entry.id} entry={entry} highlight={entry.id === currentId} />)
              )}
            </Stack>
          </Paper>
        );
      })}
    </SimpleGrid>
  );
}
