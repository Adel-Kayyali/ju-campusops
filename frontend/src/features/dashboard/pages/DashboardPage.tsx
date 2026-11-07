import { useAuth } from '@/auth/AuthContext';
import { RoleGroups } from '@/auth/roles';
import { PageHeader } from '@/shared/components/PageHeader';
import { ManagementDashboard } from '../components/ManagementDashboard';
import { PersonalDashboard } from '../components/PersonalDashboard';

/** Home page: an operations overview for management, a personal one for everybody else. */
export function DashboardPage() {
  const { user, hasRole } = useAuth();
  const isManagement = hasRole(...RoleGroups.MANAGEMENT);
  const firstName = user?.fullName.split(' ')[0] ?? '';

  return (
    <>
      <PageHeader title={`Welcome, ${firstName}`} description={isManagement ? 'Campus facilities at a glance.' : 'Your requests and activity.'} />
      {isManagement ? <ManagementDashboard /> : <PersonalDashboard />}
    </>
  );
}
