import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from '@/api/httpClient';
import { cleanParams, type Page } from '@/api/types';
import type { Asset, AssetDetail, AssetInput, AssetQuery, AssetWorkOrderInput } from './types';

export const assetKeys = {
  all: ['assets'] as const,
  list: (query: AssetQuery) => [...assetKeys.all, 'list', query] as const,
  detail: (id: string) => [...assetKeys.all, 'detail', id] as const,
};

export const assetsApi = {
  search: (query: AssetQuery) => http.get<Page<Asset>>('/assets', cleanParams(query)),
  detail: (id: string) => http.get<AssetDetail>(`/assets/${id}`),
  create: (input: AssetInput) => http.post<Asset>('/assets', input),
  update: (id: string, input: Partial<AssetInput>) => http.patch<Asset>(`/assets/${id}`, input),
  createWorkOrder: (input: AssetWorkOrderInput) => http.post<{ id: string; code: string }>('/work-orders', input),
};

export function useAssets(query: AssetQuery) {
  return useQuery({ queryKey: assetKeys.list(query), queryFn: () => assetsApi.search(query), placeholderData: keepPreviousData });
}

/** All assets in one list (for selects in other screens). */
export function useAllAssets() {
  return useAssets({ page: 1, size: 500, sortBy: 'code' });
}

export function useAssetDetail(id: string | undefined) {
  return useQuery({ queryKey: assetKeys.detail(id ?? ''), queryFn: () => assetsApi.detail(id!), enabled: Boolean(id) });
}

/** Asset mutations refresh assets, work orders and the dashboard. */
export function useAssetMutation<TVariables, TResult>(mutationFn: (variables: TVariables) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: assetKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
