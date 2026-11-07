import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from '@/api/httpClient';
import { cleanParams, type Page } from '@/api/types';
import type {
  AdjustStockInput,
  InventoryItem,
  InventoryItemDetail,
  InventoryItemInput,
  InventoryQuery,
  Material,
  Procurement,
  ProcurementInput,
  ProcurementQuery,
} from './types';

export const inventoryKeys = {
  all: ['inventory'] as const,
  items: (query: InventoryQuery) => [...inventoryKeys.all, 'items', query] as const,
  item: (id: string) => [...inventoryKeys.all, 'item', id] as const,
  shortages: () => [...inventoryKeys.all, 'shortages'] as const,
  procurements: (query: ProcurementQuery) => [...inventoryKeys.all, 'procurements', query] as const,
};

export const inventoryApi = {
  items: (query: InventoryQuery) => http.get<InventoryItem[]>('/inventory/items', cleanParams(query)),
  item: (id: string) => http.get<InventoryItemDetail>(`/inventory/items/${id}`),
  create: (input: InventoryItemInput) => http.post<InventoryItem>('/inventory/items', input),
  update: (id: string, input: Partial<Omit<InventoryItemInput, 'sku' | 'quantityOnHand'>>) => http.patch<InventoryItem>(`/inventory/items/${id}`, input),
  adjust: (id: string, input: AdjustStockInput) => http.post<InventoryItem>(`/inventory/items/${id}/adjust`, input),
  shortages: () => http.get<Material[]>('/inventory/shortages'),
  procurements: (query: ProcurementQuery) => http.get<Page<Procurement>>('/procurement-requests', cleanParams(query)),
  createProcurement: (input: ProcurementInput) => http.post<Procurement>('/procurement-requests', input),
  approve: (id: string, note?: string) => http.post<Procurement>(`/procurement-requests/${id}/approve`, { note }),
  reject: (id: string, note?: string) => http.post<Procurement>(`/procurement-requests/${id}/reject`, { note }),
  receive: (id: string) => http.post<Procurement>(`/procurement-requests/${id}/receive`),
};

export function useInventoryItems(query: InventoryQuery) {
  return useQuery({ queryKey: inventoryKeys.items(query), queryFn: () => inventoryApi.items(query), placeholderData: keepPreviousData });
}

export function useInventoryItem(id: string | null) {
  return useQuery({ queryKey: inventoryKeys.item(id ?? ''), queryFn: () => inventoryApi.item(id!), enabled: Boolean(id) });
}

export function useShortages() {
  return useQuery({ queryKey: inventoryKeys.shortages(), queryFn: inventoryApi.shortages });
}

export function useProcurements(query: ProcurementQuery) {
  return useQuery({ queryKey: inventoryKeys.procurements(query), queryFn: () => inventoryApi.procurements(query), placeholderData: keepPreviousData });
}

/** Stock changes can unblock work orders: refresh inventory, work orders and the dashboard. */
export function useInventoryMutation<TVariables, TResult>(mutationFn: (variables: TVariables) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
