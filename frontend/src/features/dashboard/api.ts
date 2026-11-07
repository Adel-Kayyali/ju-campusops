import { useQuery } from '@tanstack/react-query';
import { http } from '@/api/httpClient';
import type { ManagementOverview, PersonalOverview } from './types';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  overview: () => [...dashboardKeys.all, 'overview'] as const,
  me: () => [...dashboardKeys.all, 'me'] as const,
};

export const dashboardApi = {
  overview: () => http.get<ManagementOverview>('/dashboard/overview'),
  me: () => http.get<PersonalOverview>('/dashboard/me'),
};

export function useManagementOverview() {
  return useQuery({ queryKey: dashboardKeys.overview(), queryFn: dashboardApi.overview, refetchInterval: 60_000 });
}

export function usePersonalOverview() {
  return useQuery({ queryKey: dashboardKeys.me(), queryFn: dashboardApi.me });
}
