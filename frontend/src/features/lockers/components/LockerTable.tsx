import { ActionIcon, Group, Menu, Table, Text } from '@mantine/core';
import { IconDots, IconEye, IconPlayerPlay } from '@tabler/icons-react';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { enumLabel } from '@/shared/utils/labels';
import { formatDate, formatMoney } from '@/shared/utils/format';
import type { Locker } from '../types';

interface LockerTableProps {
  lockers: Locker[];
  onOpen: (locker: Locker) => void;
  onStart: (locker: Locker) => void;
}

export function LockerTable({ lockers, onOpen, onStart }: LockerTableProps) {
  return (
    <Table.ScrollContainer minWidth={900}>
      <Table striped highlightOnHover verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Locker</Table.Th>
            <Table.Th>Location</Table.Th>
            <Table.Th>Size / fee</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Student</Table.Th>
            <Table.Th>Start</Table.Th>
            <Table.Th>End</Table.Th>
            <Table.Th>Days left</Table.Th>
            <Table.Th />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {lockers.map((locker) => {
            const occupancy = locker.occupancy;
            return (
              <Table.Tr key={locker.id} style={{ cursor: 'pointer' }} onClick={() => onOpen(locker)}>
                <Table.Td fw={600}>{locker.code}</Table.Td>
                <Table.Td>
                  <Text size="sm">{locker.building.name}</Text>
                  <Text size="xs" c="dimmed">
                    Floor {locker.floor} • Zone {locker.zone}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{enumLabel(locker.size)}</Text>
                  <Text size="xs" c="dimmed">
                    {formatMoney(locker.monthlyFee)}/month
                  </Text>
                </Table.Td>
                <Table.Td>
                  <StatusBadge value={locker.status} />
                </Table.Td>
                <Table.Td>
                  {occupancy ? (
                    <>
                      <Text size="sm">{occupancy.student.fullName}</Text>
                      <Text size="xs" c="dimmed">
                        {occupancy.student.universityId}
                      </Text>
                    </>
                  ) : (
                    <Text size="sm" c="dimmed">
                      —
                    </Text>
                  )}
                </Table.Td>
                <Table.Td>{occupancy ? formatDate(occupancy.startDate) : '—'}</Table.Td>
                <Table.Td>{occupancy ? formatDate(occupancy.endDate) : '—'}</Table.Td>
                <Table.Td>{occupancy && occupancy.state !== 'UPCOMING' ? occupancy.daysRemaining : '—'}</Table.Td>
                <Table.Td onClick={(e) => e.stopPropagation()}>
                  <Group justify="flex-end">
                    <Menu position="bottom-end">
                      <Menu.Target>
                        <ActionIcon variant="subtle" aria-label="Actions">
                          <IconDots size={16} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item leftSection={<IconEye size={14} />} onClick={() => onOpen(locker)}>
                          Details
                        </Menu.Item>
                        <Menu.Item leftSection={<IconPlayerPlay size={14} />} disabled={locker.isOutOfService} onClick={() => onStart(locker)}>
                          Start subscription
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Group>
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
