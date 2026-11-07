import { Anchor, Badge, SimpleGrid, Table, Text } from '@mantine/core';
import { Link } from 'react-router';
import { formatNumber } from '@/shared/utils/format';
import { enumLabel } from '@/shared/utils/labels';
import type { PerformanceReport } from '../types';
import { ChartCard } from './ChartCard';

export function ReportTables({ report }: { report: PerformanceReport }) {
  return (
    <SimpleGrid cols={{ base: 1, lg: 2 }}>
      <ChartCard title="Performance by category">
        <Table fz="sm" striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Category</Table.Th>
              <Table.Th>Requests</Table.Th>
              <Table.Th>Resolved</Table.Th>
              <Table.Th>Avg hours</Table.Th>
              <Table.Th>SLA</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {report.byCategory.map((c) => (
              <Table.Tr key={c.category}>
                <Table.Td>{enumLabel(c.category)}</Table.Td>
                <Table.Td>{c.requests}</Table.Td>
                <Table.Td>{c.resolved}</Table.Td>
                <Table.Td>{formatNumber(c.averageResolutionHours)}</Table.Td>
                <Table.Td>{formatNumber(c.slaCompliance, '%')}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ChartCard>

      <ChartCard title="Technician workload">
        <Table fz="sm" striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Technician</Table.Th>
              <Table.Th>Open</Table.Th>
              <Table.Th>Completed</Table.Th>
              <Table.Th>Avg hours</Table.Th>
              <Table.Th>On time</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {report.technicians.map((t) => (
              <Table.Tr key={t.technicianId}>
                <Table.Td>{t.fullName}</Table.Td>
                <Table.Td>{t.openWorkOrders}</Table.Td>
                <Table.Td>{t.completedInPeriod}</Table.Td>
                <Table.Td>{formatNumber(t.averageCompletionHours)}</Table.Td>
                <Table.Td>{formatNumber(t.onTimeRate, '%')}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ChartCard>

      <ChartCard title="Repeat failures" description="Assets with two or more corrective repairs in the period">
        {report.repeatFailures.length === 0 ? (
          <Text size="sm" c="dimmed">
            No repeat failure in this period.
          </Text>
        ) : (
          <Table fz="sm" striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Asset</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Building</Table.Th>
                <Table.Th>Repairs</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {report.repeatFailures.map((f) => (
                <Table.Tr key={f.assetId}>
                  <Table.Td>
                    <Anchor component={Link} to={`/assets/${f.assetId}`} fw={600}>
                      {f.code}
                    </Anchor>
                    <Text size="xs" c="dimmed">
                      {f.name}
                    </Text>
                  </Table.Td>
                  <Table.Td>{enumLabel(f.type)}</Table.Td>
                  <Table.Td>{f.building}</Table.Td>
                  <Table.Td>
                    <Badge color="orange">{f.correctiveWorkOrders}</Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </ChartCard>

      <ChartCard title="Workload by building">
        <Table fz="sm" striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Building</Table.Th>
              <Table.Th>Requests in period</Table.Th>
              <Table.Th>Open now</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {report.byBuilding.map((b) => (
              <Table.Tr key={b.buildingId}>
                <Table.Td>{b.building}</Table.Td>
                <Table.Td>{b.requestsInPeriod}</Table.Td>
                <Table.Td>{b.openNow}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ChartCard>
    </SimpleGrid>
  );
}
