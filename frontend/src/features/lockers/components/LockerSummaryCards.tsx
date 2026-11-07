import { SimpleGrid } from '@mantine/core';
import { IconAlarm, IconCash, IconLock, IconLockOpen } from '@tabler/icons-react';
import { StatCard } from '@/shared/components/StatCard';
import { formatMoney } from '@/shared/utils/format';
import type { LockerStatus } from '@/shared/types/enums';
import type { LockerSummary } from '../types';

export function LockerSummaryCards({ summary, onStatusClick }: { summary: LockerSummary; onStatusClick?: (status: LockerStatus) => void }) {
  const count = (status: LockerStatus) => summary.byStatus.find((s) => s.status === status)?.count ?? 0;
  return (
    <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} mb="lg">
      <StatCard label="Free lockers" value={count('AVAILABLE')} icon={<IconLockOpen size={22} />} color="green" hint={`of ${summary.totalLockers} lockers`} onClick={() => onStatusClick?.('AVAILABLE')} />
      <StatCard label="Occupancy" value={`${summary.occupancyRate}%`} icon={<IconLock size={22} />} color="blue" hint={`${summary.activeSubscriptions} active subscriptions`} onClick={() => onStatusClick?.('OCCUPIED')} />
      <StatCard label="Expiring this week" value={summary.expiringThisWeek} icon={<IconAlarm size={22} />} color="orange" hint={`${count('EXPIRED')} expired, not released`} onClick={() => onStatusClick?.('EXPIRING_SOON')} />
      <StatCard label="Cash this month" value={formatMoney(summary.cashCollectedThisMonth)} icon={<IconCash size={22} />} color="teal" hint="Collected at the office" />
    </SimpleGrid>
  );
}
