import type { CurrentUser } from './types';

const KEY = 'campusops.session';

export interface Session {
  accessToken: string;
  user: CurrentUser;
}

/** Persists the JWT and the user profile in localStorage. */
export const sessionStore = {
  load(): Session | null {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      return null;
    }
  },
  save(session: Session): void {
    localStorage.setItem(KEY, JSON.stringify(session));
  },
  clear(): void {
    localStorage.removeItem(KEY);
  },
  get token(): string | null {
    return sessionStore.load()?.accessToken ?? null;
  },
};

/** Event fired when the API answers 401 (expired or invalid token). */
export const UNAUTHORIZED_EVENT = 'campusops:unauthorized';
