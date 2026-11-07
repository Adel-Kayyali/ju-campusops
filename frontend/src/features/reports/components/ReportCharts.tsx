import { BarChart, LineChart } from '@mantine/charts';
import { SimpleGrid, Text } from '@mantine/core';
import { formatDate } from '@/shared/utils/format';
import { enumLabel } from '@/shared/utils/labels';
import type { PerformanceReport } from '../types';
import { ChartCard } from './ChartCard';

/** The four charts of the performance report. */
export function ReportCharts({ report }: { report: PerformanceReport }) {
  const trend = report.weeklyTrend.map((w) => ({ week: formatDate(w.weekStart).slice(0, 6), Created: w.created, Resolved: w.resolved }));
  const categories = report.byCategory.map((c) => ({ category: enumLabel(c.category), 'Avg hours': c.averageResolutionHours ?? 0, 'SLA %': c.slaCompliance ?? 0 }));
  const buildings = report.byBuilding.map((b) => ({ building: b.building.split(' - ')[0], 'In period': b.requestsInPeriod, 'Open now': b.openNow }));
  const ratings = report.ratingDistribution.map((r) => ({ stars: `${r.key}★`, Ratings: r.count }));

  return (
    <SimpleGrid cols={{ base: 1, md: 2 }} mb="lg">
      <ChartCard title="Weekly trend" description="Requests created vs resolved per week">
        <LineChart h={240} data={trend} dataKey="week" series={[{ name: 'Created', color: 'blue.6' }, { name: 'Resolved', color: 'teal.6' }]} curveType="monotone" withLegend />
      </ChartCard>
      <ChartCard title="Resolution by category" description="Average hours to resolve and share resolved within the SLA">
        {categories.length === 0 ? <Text size="sm" c="dimmed">No data</Text> : <BarChart h={240} data={categories} dataKey="category" series={[{ name: 'Avg hours', color: 'cyan.6' }, { name: 'SLA %', color: 'violet.6' }]} withLegend tickLine="y" xAxisProps={{ interval: 0, angle: -25, textAnchor: 'end', height: 60 }} />}
      </ChartCard>
      <ChartCard title="Workload by building" description="Requests created in the period and still open today">
        {buildings.length === 0 ? <Text size="sm" c="dimmed">No data</Text> : <BarChart h={240} data={buildings} dataKey="building" series={[{ name: 'In period', color: 'blue.6' }, { name: 'Open now', color: 'orange.6' }]} withLegend />}
      </ChartCard>
      <ChartCard title="Requester satisfaction" description="Ratings given when confirming repairs">
        <BarChart h={240} data={ratings} dataKey="stars" series={[{ name: 'Ratings', color: 'yellow.6' }]} />
      </ChartCard>
    </SimpleGrid>
  );
}
