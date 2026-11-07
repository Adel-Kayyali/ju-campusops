import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { http } from '@/api/httpClient';
import type { PerformanceReport, ReportPeriod } from './types';

export const reportKeys = {
  all: ['dashboard', 'reports'] as const,
  performance: (period: ReportPeriod) => [...reportKeys.all, 'performance', period] as const,
};

export const reportsApi = {
  performance: (period: ReportPeriod) => http.get<PerformanceReport>('/reports/performance', period),
};

export function usePerformanceReport(period: ReportPeriod | null) {
  return useQuery({
    queryKey: reportKeys.performance(period ?? { from: '', to: '' }),
    queryFn: () => reportsApi.performance(period!),
    enabled: period !== null,
    placeholderData: keepPreviousData,
  });
}
