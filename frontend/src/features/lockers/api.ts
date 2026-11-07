import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from '@/api/httpClient';
import { cleanParams, type Page } from '@/api/types';
import type {
  ExtendSubscriptionInput,
  Locker,
  LockerDetail,
  LockerInput,
  LockerQuery,
  LockerSummary,
  Quote,
  StartSubscriptionInput,
  Subscription,
} from './types';

export const lockerKeys = {
  all: ['lockers'] as const,
  list: (query: LockerQuery) => [...lockerKeys.all, 'list', query] as const,
  summary: () => [...lockerKeys.all, 'summary'] as const,
  detail: (id: string) => [...lockerKeys.all, 'detail', id] as const,
  quote: (input: object) => [...lockerKeys.all, 'quote', input] as const,
  mine: () => [...lockerKeys.all, 'mine'] as const,
};

export const lockersApi = {
  search: (query: LockerQuery) => http.get<Page<Locker>>('/lockers', cleanParams(query)),
  summary: () => http.get<LockerSummary>('/lockers/summary'),
  detail: (id: string) => http.get<LockerDetail>(`/lockers/${id}`),
  create: (input: LockerInput) => http.post<Locker>('/lockers', input),
  update: (id: string, input: Partial<LockerInput>) => http.patch<Locker>(`/lockers/${id}`, input),
  setServiceStatus: (id: string, isOutOfService: boolean, note?: string) => http.patch<Locker>(`/lockers/${id}/service-status`, { isOutOfService, note }),
  quote: (input: { lockerId: string; startDate: string; durationMonths?: number; endDate?: string }) => http.post<Quote>('/locker-subscriptions/quote', input),
  start: (input: StartSubscriptionInput) => http.post<Subscription>('/locker-subscriptions', input),
  extend: (id: string, input: ExtendSubscriptionInput) => http.post<Subscription>(`/locker-subscriptions/${id}/extend`, input),
  end: (id: string, reason: string) => http.post<Subscription>(`/locker-subscriptions/${id}/end`, { reason }),
  mine: () => http.get<Subscription[]>('/locker-subscriptions/mine'),
};

export function useLockers(query: LockerQuery) {
  return useQuery({ queryKey: lockerKeys.list(query), queryFn: () => lockersApi.search(query), placeholderData: keepPreviousData });
}

export function useLockerSummary() {
  return useQuery({ queryKey: lockerKeys.summary(), queryFn: lockersApi.summary });
}

export function useLockerDetail(id: string | null) {
  return useQuery({ queryKey: lockerKeys.detail(id ?? ''), queryFn: () => lockersApi.detail(id!), enabled: Boolean(id) });
}

export function useQuote(input: { lockerId: string; startDate: string; durationMonths?: number; endDate?: string } | null) {
  return useQuery({
    queryKey: lockerKeys.quote(input ?? {}),
    queryFn: () => lockersApi.quote(input!),
    enabled: input !== null,
    retry: false,
    placeholderData: keepPreviousData,
  });
}

export function useMyLockers() {
  return useQuery({ queryKey: lockerKeys.mine(), queryFn: lockersApi.mine });
}

/** Every locker mutation refreshes all locker data (lists, summary, details). */
export function useLockerMutation<TVariables, TResult>(mutationFn: (variables: TVariables) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: lockerKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
