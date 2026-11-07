import { Anchor, Grid, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { DonutChart } from '@mantine/charts';
import {
  IconAlarm,
  IconAlertOctagon,
  IconBox,
  IconClipboardList,
  IconClock,
  IconHourglassHigh,
  IconMessageReport,
  IconMoodSmile,
  IconShoppingCart,
  IconTool,
  IconUserQuestion,
  IconLockOpen,
} from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router';
import { LockerSummaryCards } from '@/features/lockers/components/LockerSummaryCards';
import { QueryState } from '@/shared/components/QueryState';
import { StatCard } from '@/shared/components/StatCard';
import { enumLabel, statusColor } from '@/shared/utils/labels';
import { formatNumber } from '@/shared/utils/format';
import { useManagementOverview } from '../api';
import type { ManagementOverview } from '../types';
import { RecentRequestsTable } from './RecentRequestsTable';

/** Facility managers' and admins' overview of campus operations. */
export function ManagementDashboard() {
  const overview = useManagementOverview();
  return <QueryState query={overview}>{(data) => <OverviewContent data={data} />}</QueryState>;
}

function OverviewContent({ data }: { data: ManagementOverview }) {
  const navigate = useNavigate();
  const priorityData = data.openRequestsByPriority.map((row) => ({ name: row.key, value: row.count, color: `${statusColor(row.key)}.6` }));

  return (
    <Stack gap="lg">
      <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }}>
        <StatCard label="Open requests" value={data.openRequests} icon={<IconMessageReport size={22} />} onClick={() => navigate('/requests')} />
        <StatCard label="Waiting for dispatch" value={data.unassignedRequests} icon={<IconUserQuestion size={22} />} color="cyan" hint="Submitted or acknowledged" onClick={() => navigate('/requests')} />
        <StatCard label="Overdue requests" value={data.overdueRequests} icon={<IconAlarm size={22} />} color="red" hint={`${data.escalatedRequests} escalated`} onClick={() => navigate('/requests')} />
        <StatCard label="Avg. resolution (30 days)" value={formatNumber(data.averageResolutionHours30d, ' h')} icon={<IconHourglassHigh size={22} />} color="grape" />
        <StatCard label="Active work orders" value={data.activeWorkOrders} icon={<IconClipboardList size={22} />} color="indigo" hint={`${data.overdueWorkOrders} overdue`} onClick={() => navigate('/work-orders')} />
        <StatCard label="Waiting for parts" value={data.blockedWorkOrders} icon={<IconAlertOctagon size={22} />} color="orange" onClick={() => navigate('/work-orders')} />
        <StatCard label="Low-stock items" value={data.lowStockItems} icon={<IconBox size={22} />} color="yellow" hint={`${data.pendingProcurements} purchase(s) to approve`} onClick={() => navigate('/inventory')} />
        <StatCard label="Satisfaction (30 days)" value={data.satisfactionAverage30d === null ? '—' : `${data.satisfactionAverage30d} / 5`} icon={<IconMoodSmile size={22} />} color="green" />
      </SimpleGrid>

      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper withBorder radius="md" p="md" h="100%">
            <Title order={5} mb="md">
              Open requests by priority
            </Title>
            {priorityData.length === 0 ? (
              <Text size="sm" c="dimmed">
                No open request.
              </Text>
            ) : (
              <Stack align="center">
                <DonutChart data={priorityData} withLabelsLine withLabels size={180} thickness={28} chartLabel={`${data.openRequests} open`} />
                <Group gap="md">
                  {priorityData.map((p) => (
                    <Group key={p.name} gap={4}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: `var(--mantine-color-${statusColor(p.name)}-6)` }} />
                      <Text size="xs">
                        {enumLabel(p.name)}: {p.value}
                      </Text>
                    </Group>
                  ))}
                </Group>
              </Stack>
            )}
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Paper withBorder radius="md" p="md" h="100%">
            <Group justify="space-between" mb="sm">
              <Title order={5}>Latest requests</Title>
              <Anchor component={Link} to="/requests" size="sm">
                View all
              </Anchor>
            </Group>
            <RecentRequestsTable requests={data.recentRequests} />
          </Paper>
        </Grid.Col>
      </Grid>

      <div>
        <Group justify="space-between" mb="sm">
          <Group gap="xs">
            <IconLockOpen size={18} />
            <Title order={5}>Student lockers</Title>
          </Group>
          <Anchor component={Link} to="/lockers" size="sm">
            Manage lockers
          </Anchor>
        </Group>
        <LockerSummaryCards summary={data.lockers} onStatusClick={() => navigate('/lockers')} />
      </div>

      <Group gap="lg">
        <Anchor component={Link} to="/reports" size="sm">
          <Group gap={4}>
            <IconClock size={14} /> Performance reports
          </Group>
        </Anchor>
        <Anchor component={Link} to="/maintenance" size="sm">
          <Group gap={4}>
            <IconTool size={14} /> Preventive maintenance
          </Group>
        </Anchor>
        <Anchor component={Link} to="/inventory" size="sm">
          <Group gap={4}>
            <IconShoppingCart size={14} /> Procurement
          </Group>
        </Anchor>
      </Group>
    </Stack>
  );
}
