import { http } from '@/api/httpClient';
import type { CurrentUser, LoginResponse, RegisterInput } from './types';

export const authApi = {
  login: (email: string, password: string) => http.post<LoginResponse>('/auth/login', { email, password }),
  register: (input: RegisterInput) => http.post<LoginResponse>('/auth/register', input),
  me: () => http.get<CurrentUser>('/auth/me'),
  logout: () => http.post<void>('/auth/logout'),
  changePassword: (currentPassword: string, newPassword: string) => http.post<void>('/auth/change-password', { currentPassword, newPassword }),
};
