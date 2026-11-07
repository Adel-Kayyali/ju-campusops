import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from '@/api/httpClient';
import { cleanParams, type Page, type PageParams } from '@/api/types';
import type { Role } from '@/shared/types/enums';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  universityId: string | null;
  phone: string | null;
  department: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface UserQuery extends PageParams {
  search?: string;
  role?: Role;
  isActive?: boolean;
}

export interface CreateUserInput {
  email: string;
  fullName: string;
  role: Role;
  password: string;
  universityId?: string;
  phone?: string;
  department?: string;
}

export type UpdateUserInput = Partial<Omit<CreateUserInput, 'email' | 'password'>>;

export const userKeys = {
  all: ['users'] as const,
  list: (query: UserQuery) => [...userKeys.all, 'list', query] as const,
};

export const usersApi = {
  search: (query: UserQuery) => http.get<Page<User>>('/users', cleanParams(query)),
  create: (input: CreateUserInput) => http.post<User>('/users', input),
  update: (id: string, input: UpdateUserInput) => http.patch<User>(`/users/${id}`, input),
  setActive: (id: string, isActive: boolean) => http.patch<User>(`/users/${id}/status`, { isActive }),
  resetPassword: (id: string, newPassword: string) => http.post<void>(`/users/${id}/reset-password`, { newPassword }),
};

export function useUsers(query: UserQuery, enabled = true) {
  return useQuery({ queryKey: userKeys.list(query), queryFn: () => usersApi.search(query), placeholderData: keepPreviousData, enabled });
}

/** Invalidates every user list after a change. */
export function useUserMutation<TVariables, TResult = unknown>(mutationFn: (variables: TVariables) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn, onSuccess: () => queryClient.invalidateQueries({ queryKey: userKeys.all }) });
}
