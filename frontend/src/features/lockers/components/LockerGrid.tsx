import { Badge, Paper, SimpleGrid, Stack, Text, Tooltip } from '@mantine/core';
import { enumLabel, statusColor } from '@/shared/utils/labels';
import { formatDate } from '@/shared/utils/format';
import type { Locker } from '../types';

/** Visual map of the lockers: one coloured tile per locker. */
export function LockerGrid({ lockers, onSelect }: { lockers: Locker[]; onSelect: (locker: Locker) => void }) {
  return (
    <SimpleGrid cols={{ base: 2, xs: 3, sm: 4, md: 6, lg: 8 }} spacing="sm">
      {lockers.map((locker) => {
        const color = statusColor(locker.status);
        const tooltip = locker.occupancy
          ? `${locker.occupancy.student.fullName} • until ${formatDate(locker.occupancy.endDate)}`
          : locker.isOutOfService
            ? (locker.outOfServiceNote ?? 'Out of service')
            : 'Free';
        return (
          <Tooltip key={locker.id} label={tooltip} withArrow>
            <Paper
              withBorder
              radius="md"
              p="xs"
              onClick={() => onSelect(locker)}
              style={{ cursor: 'pointer', borderLeft: `5px solid var(--mantine-color-${color}-6)` }}
            >
              <Stack gap={4}>
                <Text fw={700} size="sm">
                  {locker.code}
                </Text>
                <Text size="xs" c="dimmed" lineClamp={1}>
                  {locker.building.code} • Floor {locker.floor} • {enumLabel(locker.size)}
                </Text>
                <Badge size="xs" color={color} variant="light">
                  {enumLabel(locker.status)}
                </Badge>
                <Text size="xs" lineClamp={1} c={locker.occupancy ? undefined : 'dimmed'}>
                  {locker.occupancy ? locker.occupancy.student.fullName : '—'}
                </Text>
              </Stack>
            </Paper>
          </Tooltip>
        );
      })}
    </SimpleGrid>
  );
}
