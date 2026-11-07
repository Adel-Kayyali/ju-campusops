import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from '@/api/httpClient';
import { cleanParams, type Page } from '@/api/types';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (params: object) => [...notificationKeys.all, 'list', params] as const,
  unread: () => [...notificationKeys.all, 'unread'] as const,
};

export const notificationsApi = {
  list: (params: { page?: number; size?: number; unreadOnly?: boolean }) => http.get<Page<AppNotification>>('/notifications', cleanParams(params)),
  unreadCount: () => http.get<{ count: number }>('/notifications/unread-count'),
  markRead: (id: string) => http.patch<void>(`/notifications/${id}/read`),
  markAllRead: () => http.patch<void>('/notifications/read-all'),
};

export function useNotifications(params: { page?: number; size?: number; unreadOnly?: boolean }) {
  return useQuery({ queryKey: notificationKeys.list(params), queryFn: () => notificationsApi.list(params), placeholderData: keepPreviousData });
}

/** Polls the unread counter every 30 seconds for the bell icon. */
export function useUnreadCount() {
  return useQuery({ queryKey: notificationKeys.unread(), queryFn: notificationsApi.unreadCount, refetchInterval: 30_000 });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}
