import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from '@/api/httpClient';
import { cleanParams, type Page } from '@/api/types';
import type { Attachment } from '@/shared/types/common';
import type { InventoryItemOption, Material, TechnicianOption, WorkOrder, WorkOrderDetail, WorkOrderQuery } from './types';

export const workOrderKeys = {
  all: ['work-orders'] as const,
  list: (query: WorkOrderQuery) => [...workOrderKeys.all, 'list', query] as const,
  detail: (id: string) => [...workOrderKeys.all, 'detail', id] as const,
  technicians: ['technicians', 'list'] as const,
  items: ['inventory', 'items', 'options'] as const,
};

export const workOrdersApi = {
  search: (query: WorkOrderQuery) => http.get<Page<WorkOrder>>('/work-orders', cleanParams(query)),
  detail: (id: string) => http.get<WorkOrderDetail>(`/work-orders/${id}`),
  assign: (id: string, technicianId: string) => http.post<WorkOrderDetail>(`/work-orders/${id}/assign`, { technicianId }),
  cancel: (id: string, reason: string) => http.post<WorkOrderDetail>(`/work-orders/${id}/cancel`, { reason }),
  verify: (id: string) => http.post<WorkOrderDetail>(`/work-orders/${id}/verify`),
  startTask: (id: string, taskId: string) => http.post<WorkOrderDetail>(`/work-orders/${id}/tasks/${taskId}/start`),
  completeTask: (id: string, taskId: string, notes?: string) => http.post<WorkOrderDetail>(`/work-orders/${id}/tasks/${taskId}/complete`, { notes }),
  skipTask: (id: string, taskId: string, reason: string) => http.post<WorkOrderDetail>(`/work-orders/${id}/tasks/${taskId}/skip`, { reason }),
  addMaterial: (id: string, itemId: string, quantity: number) => http.post<Material[]>(`/work-orders/${id}/materials`, { itemId, quantity }),
  consumeMaterial: (id: string, materialId: string) => http.post<Material[]>(`/work-orders/${id}/materials/${materialId}/consume`),
  releaseMaterial: (id: string, materialId: string) => http.post<Material[]>(`/work-orders/${id}/materials/${materialId}/release`),
  uploadEvidence: (id: string, files: File[]) => http.upload<Attachment[]>(`/work-orders/${id}/attachments`, files),
  technicians: () => http.get<TechnicianOption[]>('/technicians'),
  inventoryItems: () => http.get<InventoryItemOption[]>('/inventory/items'),
};

export function useWorkOrders(query: WorkOrderQuery) {
  return useQuery({ queryKey: workOrderKeys.list(query), queryFn: () => workOrdersApi.search(query), placeholderData: keepPreviousData });
}

export function useWorkOrderDetail(id: string | undefined) {
  return useQuery({ queryKey: workOrderKeys.detail(id ?? ''), queryFn: () => workOrdersApi.detail(id!), enabled: Boolean(id) });
}

export function useTechnicianOptions(enabled = true) {
  return useQuery({ queryKey: workOrderKeys.technicians, queryFn: workOrdersApi.technicians, enabled, staleTime: 60_000 });
}

export function useInventoryItemOptions(enabled = true) {
  return useQuery({ queryKey: workOrderKeys.items, queryFn: workOrdersApi.inventoryItems, enabled });
}

/** Work-order changes also affect requests, inventory, assets and dashboards. */
export function useWorkOrderMutation<TVariables, TResult>(mutationFn: (variables: TVariables) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      for (const key of [workOrderKeys.all, ['service-requests'], ['inventory'], ['assets'], ['dashboard'], ['notifications']]) {
        void queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}
