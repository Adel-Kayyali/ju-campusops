/** Runtime configuration, read once from Vite environment variables. */
export const env = {
  apiUrl: (import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api').replace(/\/$/, ''),
} as const;
