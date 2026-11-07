import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from '@/api/httpClient';
import { cleanParams, type Page } from '@/api/types';
import type { Attachment } from '@/shared/types/common';
import type { RequestCategory } from '@/shared/types/enums';
import type {
  AssetOption,
  CreateRequestInput,
  CreateWorkOrderFromRequestInput,
  RequestQuery,
  ServiceRequest,
  ServiceRequestDetail,
  TechnicianSuggestion,
} from './types';

export const requestKeys = {
  all: ['service-requests'] as const,
  list: (query: RequestQuery) => [...requestKeys.all, 'list', query] as const,
  detail: (id: string) => [...requestKeys.all, 'detail', id] as const,
  suggestions: (category: string, buildingId: string) => ['technicians', 'suggestions', category, buildingId] as const,
  assets: (buildingId: string) => ['assets', 'by-building', buildingId] as const,
};

export const requestsApi = {
  search: (query: RequestQuery) => http.get<Page<ServiceRequest>>('/service-requests', cleanParams(query)),
  detail: (id: string) => http.get<ServiceRequestDetail>(`/service-requests/${id}`),
  create: (input: CreateRequestInput) => http.post<ServiceRequestDetail>('/service-requests', input),
  upload: (id: string, files: File[]) => http.upload<Attachment[]>(`/service-requests/${id}/attachments`, files),
  acknowledge: (id: string, note?: string) => http.post<ServiceRequestDetail>(`/service-requests/${id}/acknowledge`, { note }),
  reject: (id: string, reason: string) => http.post<ServiceRequestDetail>(`/service-requests/${id}/reject`, { reason }),
  close: (id: string, note?: string) => http.post<ServiceRequestDetail>(`/service-requests/${id}/close`, { note }),
  confirm: (id: string, rating: number, comment?: string) => http.post<ServiceRequestDetail>(`/service-requests/${id}/confirm`, { rating, comment }),
  reopen: (id: string, reason: string) => http.post<ServiceRequestDetail>(`/service-requests/${id}/reopen`, { reason }),
  suggestions: (category: RequestCategory, buildingId: string) => http.get<TechnicianSuggestion[]>('/technicians/suggestions', { category, buildingId }),
  createWorkOrder: (input: CreateWorkOrderFromRequestInput) => http.post<{ id: string; code: string }>('/work-orders', input),
  assetsInBuilding: (buildingId: string) => http.get<Page<AssetOption>>('/assets', { buildingId, size: 100, sortBy: 'code' }),
};

export function useRequests(query: RequestQuery) {
  return useQuery({ queryKey: requestKeys.list(query), queryFn: () => requestsApi.search(query), placeholderData: keepPreviousData });
}

export function useRequestDetail(id: string | undefined) {
  return useQuery({ queryKey: requestKeys.detail(id ?? ''), queryFn: () => requestsApi.detail(id!), enabled: Boolean(id) });
}

export function useTechnicianSuggestions(category: RequestCategory | undefined, buildingId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: requestKeys.suggestions(category ?? '', buildingId ?? ''),
    queryFn: () => requestsApi.suggestions(category!, buildingId!),
    enabled: enabled && Boolean(category && buildingId),
  });
}

export function useAssetsInBuilding(buildingId: string | null) {
  return useQuery({ queryKey: requestKeys.assets(buildingId ?? ''), queryFn: () => requestsApi.assetsInBuilding(buildingId!), enabled: Boolean(buildingId), staleTime: 5 * 60_000 });
}

/** Every request mutation refreshes requests, work orders and dashboards. */
export function useRequestMutation<TVariables, TResult>(mutationFn: (variables: TVariables) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: requestKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
