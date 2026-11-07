import { http } from '@/api/httpClient';
import type { CurrentUser, LoginResponse } from './types';

export const authApi = {
  login: (email: string, password: string) => http.post<LoginResponse>('/auth/login', { email, password }),
  me: () => http.get<CurrentUser>('/auth/me'),
  logout: () => http.post<void>('/auth/logout'),
  changePassword: (currentPassword: string, newPassword: string) => http.post<void>('/auth/change-password', { currentPassword, newPassword }),
};
