import axios from 'axios';
import { sessionStore, UNAUTHORIZED_EVENT } from '@/auth/sessionStorage';
import { env } from '@/config/env';
import { toApiError } from './apiError';

/** The single HTTP client of the application. */
export const httpClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 30_000,
});

httpClient.interceptors.request.use((config) => {
  const token = sessionStore.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError = toApiError(error);
    const isLogin = String(error?.config?.url ?? '').includes('/auth/login');
    if (apiError.status === 401 && !isLogin) {
      sessionStore.clear();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    return Promise.reject(apiError);
  },
);

/** Small typed helpers so feature API files stay one-liners. */
export const http = {
  get: <T>(url: string, params?: object) => httpClient.get<T>(url, { params }).then((r) => r.data),
  post: <T>(url: string, body?: unknown) => httpClient.post<T>(url, body).then((r) => r.data),
  put: <T>(url: string, body?: unknown) => httpClient.put<T>(url, body).then((r) => r.data),
  patch: <T>(url: string, body?: unknown) => httpClient.patch<T>(url, body).then((r) => r.data),
  upload: <T>(url: string, files: File[]) => {
    const form = new FormData();
    files.forEach((file) => form.append('files', file));
    return httpClient.post<T>(url, form).then((r) => r.data);
  },
};
