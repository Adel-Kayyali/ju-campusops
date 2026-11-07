import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Role } from '@/shared/types/enums';
import { authApi } from './authApi';
import { hasAnyRole } from './roles';
import { sessionStore, UNAUTHORIZED_EVENT, type Session } from './sessionStorage';
import type { CurrentUser } from './types';

interface AuthContextValue {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<CurrentUser>;
  logout: () => void;
  hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Holds the logged-in user and exposes login / logout to the whole app. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => sessionStore.load());
  const queryClient = useQueryClient();

  const logout = useCallback(() => {
    sessionStore.clear();
    setSession(null);
    queryClient.clear();
  }, [queryClient]);

  // The HTTP client fires this event when the token expires.
  useEffect(() => {
    const onUnauthorized = () => setSession(null);
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  // Refresh the profile once at start-up (role or name may have changed).
  useEffect(() => {
    if (!sessionStore.token) return;
    authApi
      .me()
      .then((user) => {
        const current = sessionStore.load();
        if (current) {
          const updated = { ...current, user };
          sessionStore.save(updated);
          setSession(updated);
        }
      })
      .catch(() => undefined);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    const newSession = { accessToken: response.accessToken, user: response.user };
    sessionStore.save(newSession);
    setSession(newSession);
    return response.user;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      isAuthenticated: session !== null,
      login,
      logout,
      hasRole: (...roles: Role[]) => hasAnyRole(session?.user.role, roles),
    }),
    [session, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return context;
}
