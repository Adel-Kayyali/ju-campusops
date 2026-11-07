import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { ForbiddenPage } from '@/shared/components/ForbiddenPage';
import type { Role } from '@/shared/types/enums';
import { useAuth } from './AuthContext';

/** Redirects anonymous visitors to the login page. */
export function RequireAuth() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}

/** Renders the children only for the given roles (route-level access control). */
export function RequireRole({ roles, children }: { roles: readonly Role[]; children: ReactNode }) {
  const { hasRole } = useAuth();
  return hasRole(...roles) ? <>{children}</> : <ForbiddenPage />;
}
