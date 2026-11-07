import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from '@/api/httpClient';
import type { Priority } from '@/shared/types/enums';

export interface SlaPolicy {
  priority: Priority;
  responseHours: number;
  resolutionHours: number;
  description: string | null;
}

export type SlaPolicyInput = Omit<SlaPolicy, 'priority' | 'description'> & { description?: string };

export const slaKeys = {
  all: ['sla-policies'] as const,
};

export const slaApi = {
  list: () => http.get<SlaPolicy[]>('/sla-policies'),
  update: (priority: Priority, input: SlaPolicyInput) => http.put<SlaPolicy>(`/sla-policies/${priority}`, input),
};

export function useSlaPolicies() {
  return useQuery({ queryKey: slaKeys.all, queryFn: slaApi.list });
}

export function useUpdateSlaPolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ priority, input }: { priority: Priority; input: SlaPolicyInput }) => slaApi.update(priority, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: slaKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
