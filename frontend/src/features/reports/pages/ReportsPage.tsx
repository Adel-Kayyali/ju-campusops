import { Group, Loader } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import dayjs from 'dayjs';
import { useState } from 'react';
import { PageHeader } from '@/shared/components/PageHeader';
import { QueryState } from '@/shared/components/QueryState';
import { usePerformanceReport } from '../api';
import { ReportCharts } from '../components/ReportCharts';
import { ReportKpis } from '../components/ReportKpis';
import { ReportTables } from '../components/ReportTables';

/** Service-level monitoring: resolution times, SLA compliance, workload and repeat failures. */
export function ReportsPage() {
  const [range, setRange] = useState<[string | null, string | null]>([dayjs().subtract(30, 'day').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')]);
  const period = range[0] && range[1] ? { from: range[0], to: range[1] } : null;
  const report = usePerformanceReport(period);

  return (
    <>
      <PageHeader
        title="Performance reports"
        description="Requests created in the selected period, how fast they were resolved, and where the workload is."
        actions={
          <Group gap="xs">
            {report.isFetching && <Loader size="xs" />}
            <DatePickerInput type="range" label="Period" valueFormat="DD MMM YYYY" value={range} onChange={(v) => setRange(v as [string | null, string | null])} maxDate={dayjs().format('YYYY-MM-DD')} w={280} />
          </Group>
        }
      />
      <QueryState query={report}>
        {(data) => (
          <>
            <ReportKpis report={data} />
            <ReportCharts report={data} />
            <ReportTables report={data} />
          </>
        )}
      </QueryState>
    </>
  );
}
