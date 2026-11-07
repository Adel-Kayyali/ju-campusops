import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from '@/api/httpClient';
import { cleanParams } from '@/api/types';
import type { GenerationResult, Schedule, ScheduleInput, ScheduleUpdate } from './types';

export const scheduleKeys = {
  all: ['maintenance-schedules'] as const,
  list: (params: object) => [...scheduleKeys.all, 'list', params] as const,
};

export const schedulesApi = {
  list: (params: { assetId?: string; activeOnly?: boolean }) => http.get<Schedule[]>('/maintenance-schedules', cleanParams(params)),
  create: (input: ScheduleInput) => http.post<Schedule>('/maintenance-schedules', input),
  update: (id: string, input: ScheduleUpdate) => http.patch<Schedule>(`/maintenance-schedules/${id}`, input),
  generate: () => http.post<GenerationResult>('/maintenance-schedules/generate'),
};

export function useSchedules(params: { assetId?: string; activeOnly?: boolean }) {
  return useQuery({ queryKey: scheduleKeys.list(params), queryFn: () => schedulesApi.list(params) });
}

/** Schedule changes may create work orders: refresh those and the assets too. */
export function useScheduleMutation<TVariables, TResult>(mutationFn: (variables: TVariables) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      void queryClient.invalidateQueries({ queryKey: ['assets'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
