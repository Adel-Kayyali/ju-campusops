import { Badge, Group, Paper, Progress, Stack, Table, Text } from '@mantine/core';
import type { ReactNode } from 'react';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { formatDate, formatDateTime, formatMoney } from '@/shared/utils/format';
import type { Subscription } from '../types';

interface SubscriptionCardProps {
  subscription: Subscription;
  showStudent?: boolean;
  actions?: ReactNode;
}

/** One subscription with its period, remaining time and cash receipts. */
export function SubscriptionCard({ subscription, showStudent = false, actions }: SubscriptionCardProps) {
  const totalDays = Math.max(1, Math.round((new Date(subscription.endDate).getTime() - new Date(subscription.startDate).getTime()) / 86_400_000) + 1);
  const isLive = subscription.status === 'ACTIVE' && subscription.state !== 'UPCOMING';
  const progress = isLive ? Math.min(100, Math.max(0, ((totalDays - subscription.daysRemaining) / totalDays) * 100)) : subscription.state === 'UPCOMING' ? 0 : 100;

  return (
    <Paper withBorder radius="md" p="md">
      <Stack gap="xs">
        <Group justify="space-between" wrap="wrap">
          <Group gap="xs">
            <Text fw={700}>{subscription.locker.code}</Text>
            <StatusBadge value={subscription.state} />
          </Group>
          {actions}
        </Group>
        <Text size="sm" c="dimmed">
          {subscription.locker.building.name} • Floor {subscription.locker.floor} • Zone {subscription.locker.zone}
        </Text>
        {showStudent && (
          <Text size="sm">
            Student: <b>{subscription.student.fullName}</b> ({subscription.student.universityId})
          </Text>
        )}
        <Group justify="space-between">
          <Text size="sm">
            {formatDate(subscription.startDate)} → {formatDate(subscription.endDate)}
          </Text>
          {isLive && (
            <Badge variant="light" color={subscription.state === 'EXPIRING_SOON' ? 'orange' : subscription.state === 'EXPIRED' ? 'red' : 'blue'}>
              {subscription.state === 'EXPIRED' ? 'Expired' : `${subscription.daysRemaining} day(s) left`}
            </Badge>
          )}
        </Group>
        <Progress value={progress} size="sm" color={subscription.state === 'EXPIRING_SOON' ? 'orange' : 'blue'} />
        {subscription.endReason && (
          <Text size="xs" c="dimmed">
            {subscription.status === 'CANCELLED' ? 'Cancelled' : 'Ended'} {formatDateTime(subscription.endedAt)} by {subscription.endedBy}: {subscription.endReason}
          </Text>
        )}
        <Table fz="xs" withRowBorders={false} mt={4}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Receipt</Table.Th>
              <Table.Th>Period</Table.Th>
              <Table.Th>Paid</Table.Th>
              <Table.Th>Received</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {subscription.payments.map((payment) => (
              <Table.Tr key={payment.id}>
                <Table.Td style={{ whiteSpace: "nowrap" }}>{payment.receiptNumber}</Table.Td>
                <Table.Td>
                  {formatDate(payment.periodStart)} → {formatDate(payment.periodEnd)}
                </Table.Td>
                <Table.Td>
                  {formatMoney(payment.amount)} ({payment.method.toLowerCase()})
                </Table.Td>
                <Table.Td>
                  {formatDate(payment.receivedAt)} by {payment.receivedBy}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
        <Text size="xs" ta="right" fw={600}>
          Total paid: {formatMoney(subscription.totalPaid)}
        </Text>
      </Stack>
    </Paper>
  );
}
