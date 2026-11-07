import { SimpleGrid } from '@mantine/core';
import { IconCheck, IconClock, IconHourglass, IconInbox, IconMoodSmile, IconTargetArrow } from '@tabler/icons-react';
import { StatCard } from '@/shared/components/StatCard';
import { formatNumber } from '@/shared/utils/format';
import type { PerformanceReport } from '../types';

export function ReportKpis({ report }: { report: PerformanceReport }) {
  return (
    <SimpleGrid cols={{ base: 2, sm: 3, lg: 6 }} mb="lg">
      <StatCard label="Requests" value={report.totalRequests} icon={<IconInbox size={22} />} hint="created in the period" />
      <StatCard label="Resolved" value={report.resolvedRequests} icon={<IconCheck size={22} />} color="green" />
      <StatCard label="Unresolved" value={report.unresolvedRequests} icon={<IconHourglass size={22} />} color="orange" />
      <StatCard label="Avg resolution" value={formatNumber(report.averageResolutionHours, ' h')} icon={<IconClock size={22} />} color="cyan" />
      <StatCard label="SLA compliance" value={formatNumber(report.slaCompliance, '%')} icon={<IconTargetArrow size={22} />} color="violet" hint="resolved within target" />
      <StatCard label="Satisfaction" value={report.satisfactionAverage === null ? '—' : `${report.satisfactionAverage} / 5`} icon={<IconMoodSmile size={22} />} color="yellow" />
    </SimpleGrid>
  );
}
