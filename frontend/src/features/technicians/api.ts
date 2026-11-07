import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from '@/api/httpClient';
import type { Technician, TechnicianProfileInput } from './types';

export const technicianKeys = {
  all: ['technicians'] as const,
  list: () => [...technicianKeys.all, 'list'] as const,
};

export const techniciansApi = {
  list: () => http.get<Technician[]>('/technicians'),
  updateProfile: (id: string, input: TechnicianProfileInput) => http.patch<Technician>(`/technicians/${id}/profile`, input),
};

export function useTechnicians(enabled = true) {
  return useQuery({ queryKey: technicianKeys.list(), queryFn: techniciansApi.list, enabled });
}

export function technicianOptions(technicians: Technician[] | undefined): { value: string; label: string }[] {
  return (technicians ?? []).filter((t) => t.isActive).map((t) => ({ value: t.id, label: `${t.fullName} (${t.openWorkOrders}/${t.maxOpenOrders} open)` }));
}

export function useUpdateTechnicianProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TechnicianProfileInput }) => techniciansApi.updateProfile(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: technicianKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
