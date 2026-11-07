import { createBrowserRouter } from 'react-router';
import { RequireAuth, RequireRole } from '@/auth/guards';
import { LoginPage } from '@/auth/LoginPage';
import { RoleGroups } from '@/auth/roles';
import { AssetDetailPage } from '@/features/assets/pages/AssetDetailPage';
import { AssetListPage } from '@/features/assets/pages/AssetListPage';
import { AuditLogPage } from '@/features/audit/pages/AuditLogPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { InventoryPage } from '@/features/inventory/pages/InventoryPage';
import { LockersPage } from '@/features/lockers/pages/LockersPage';
import { MyLockersPage } from '@/features/lockers/pages/MyLockersPage';
import { SchedulesPage } from '@/features/maintenance/pages/SchedulesPage';
import { NotificationsPage } from '@/features/notifications/pages/NotificationsPage';
import { ReportsPage } from '@/features/reports/pages/ReportsPage';
import { NewRequestPage } from '@/features/requests/pages/NewRequestPage';
import { RequestDetailPage } from '@/features/requests/pages/RequestDetailPage';
import { RequestListPage } from '@/features/requests/pages/RequestListPage';
import { SlaSettingsPage } from '@/features/settings/pages/SlaSettingsPage';
import { TechniciansPage } from '@/features/technicians/pages/TechniciansPage';
import { UsersPage } from '@/features/users/pages/UsersPage';
import { WorkOrderDetailPage } from '@/features/work-orders/pages/WorkOrderDetailPage';
import { WorkOrderListPage } from '@/features/work-orders/pages/WorkOrderListPage';
import { AppLayout } from '@/layout/AppLayout';
import { NotFoundPage } from '@/shared/components/NotFoundPage';

/**
 * All routes. Pages are protected twice: here (RequireRole, for the UI)
 * and by the API (the real security boundary).
 */
export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'notifications', element: <NotificationsPage /> },

          // service requests (everyone)
          { path: 'requests', element: <RequestListPage /> },
          { path: 'requests/new', element: <NewRequestPage /> },
          { path: 'requests/:id', element: <RequestDetailPage /> },

          // work orders (technicians + management)
          { path: 'work-orders', element: <RequireRole roles={RoleGroups.FIELD_STAFF}><WorkOrderListPage /></RequireRole> },
          { path: 'work-orders/:id', element: <RequireRole roles={RoleGroups.FIELD_STAFF}><WorkOrderDetailPage /></RequireRole> },

          // lockers
          { path: 'lockers', element: <RequireRole roles={RoleGroups.MANAGEMENT}><LockersPage /></RequireRole> },
          { path: 'my-lockers', element: <RequireRole roles={['STUDENT']}><MyLockersPage /></RequireRole> },

          // facilities
          { path: 'assets', element: <RequireRole roles={RoleGroups.FIELD_STAFF}><AssetListPage /></RequireRole> },
          { path: 'assets/:id', element: <RequireRole roles={RoleGroups.FIELD_STAFF}><AssetDetailPage /></RequireRole> },
          { path: 'maintenance', element: <RequireRole roles={RoleGroups.FIELD_STAFF}><SchedulesPage /></RequireRole> },
          { path: 'inventory', element: <RequireRole roles={RoleGroups.FIELD_STAFF}><InventoryPage /></RequireRole> },
          { path: 'technicians', element: <RequireRole roles={RoleGroups.MANAGEMENT}><TechniciansPage /></RequireRole> },

          // management
          { path: 'reports', element: <RequireRole roles={RoleGroups.MANAGEMENT}><ReportsPage /></RequireRole> },
          { path: 'admin/users', element: <RequireRole roles={['ADMIN']}><UsersPage /></RequireRole> },
          { path: 'admin/audit', element: <RequireRole roles={RoleGroups.MANAGEMENT}><AuditLogPage /></RequireRole> },
          { path: 'admin/sla', element: <RequireRole roles={RoleGroups.MANAGEMENT}><SlaSettingsPage /></RequireRole> },

          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
