import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http } from '@/api/httpClient';
import { cleanParams, type Page } from '@/api/types';
import type { TeacherStatus } from '@/shared/types/enums';
import type { ScheduleEntryInput, Teacher, TeacherDetail, TeacherProfileInput, TeacherQuery } from './types';

export const teacherKeys = {
  all: ['teachers'] as const,
  list: (query: TeacherQuery) => [...teacherKeys.all, 'list', query] as const,
  detail: (id: string) => [...teacherKeys.all, 'detail', id] as const,
  mine: () => [...teacherKeys.all, 'mine'] as const,
  departments: () => [...teacherKeys.all, 'departments'] as const,
};

export const teachersApi = {
  search: (query: TeacherQuery) => http.get<Page<Teacher>>('/teachers', cleanParams(query)),
  detail: (id: string) => http.get<TeacherDetail>(`/teachers/${id}`),
  departments: () => http.get<string[]>('/teachers/departments'),
  mine: () => http.get<TeacherDetail>('/teachers/me'),
  updateMyProfile: (input: TeacherProfileInput) => http.patch<TeacherDetail>('/teachers/me', input),
  replaceMySchedule: (entries: ScheduleEntryInput[]) => http.put<TeacherDetail>('/teachers/me/schedule', { entries }),
  setMyStatus: (status: TeacherStatus) => http.put<TeacherDetail>('/teachers/me/status', { status }),
};

/** The directory refreshes every minute so statuses stay current. */
export function useTeachers(query: TeacherQuery) {
  return useQuery({ queryKey: teacherKeys.list(query), queryFn: () => teachersApi.search(query), placeholderData: keepPreviousData, refetchInterval: 60_000 });
}

export function useTeacher(id: string | null) {
  return useQuery({ queryKey: teacherKeys.detail(id ?? ''), queryFn: () => teachersApi.detail(id!), enabled: Boolean(id) });
}

export function useTeacherDepartments() {
  return useQuery({ queryKey: teacherKeys.departments(), queryFn: teachersApi.departments, staleTime: 5 * 60_000 });
}

export function useMyTeacherProfile(enabled = true) {
  return useQuery({ queryKey: teacherKeys.mine(), queryFn: teachersApi.mine, enabled });
}

/** Every change of the teacher's own data updates "mine" at once and refreshes the directory. */
export function useMyTeacherMutation<TVariables>(mutationFn: (variables: TVariables) => Promise<TeacherDetail>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (updated) => {
      queryClient.setQueryData(teacherKeys.mine(), updated);
      void queryClient.invalidateQueries({ queryKey: teacherKeys.all });
    },
  });
}
