import { Text, ThemeIcon, Timeline } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { enumLabel, statusColor } from '@/shared/utils/labels';
import { formatDateTime } from '@/shared/utils/format';
import type { StatusHistoryEntry } from '../types';

/** Every status change, oldest first: who, when and why. */
export function RequestTimeline({ history }: { history: StatusHistoryEntry[] }) {
  return (
    <Timeline active={history.length - 1} bulletSize={22} lineWidth={2}>
      {history.map((entry, index) => (
        <Timeline.Item
          key={`${entry.toStatus}-${entry.changedAt}-${index}`}
          title={enumLabel(entry.toStatus)}
          bullet={
            <ThemeIcon size={22} radius="xl" color={statusColor(entry.toStatus)}>
              <IconCheck size={12} />
            </ThemeIcon>
          }
        >
          {entry.note && (
            <Text size="sm" mt={2}>
              {entry.note}
            </Text>
          )}
          <Text size="xs" c="dimmed" mt={4}>
            {entry.changedBy} ({enumLabel(entry.changedByRole)}) • {formatDateTime(entry.changedAt)}
          </Text>
        </Timeline.Item>
      ))}
    </Timeline>
  );
}
