import {
  IconBox,
  IconBuildingWarehouse,
  IconCalendarRepeat,
  IconChartBar,
  IconClipboardList,
  IconHistory,
  IconHome,
  IconLock,
  IconSettings,
  IconTool,
  IconUsers,
  IconUserCog,
  IconLockAccess,
  IconMessageReport,
} from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { RoleGroups } from '@/auth/roles';
import type { Role } from '@/shared/types/enums';

export interface NavItem {
  label: string;
  to: string;
  icon: ReactNode;
  roles: readonly Role[];
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

const size = 18;

/** Sidebar menu. Each entry is shown only to the roles allowed to open the page. */
export const NAVIGATION: NavSection[] = [
  {
    items: [
      { label: 'Dashboard', to: '/', icon: <IconHome size={size} />, roles: RoleGroups.ALL },
      { label: 'Service requests', to: '/requests', icon: <IconMessageReport size={size} />, roles: RoleGroups.ALL },
      { label: 'Work orders', to: '/work-orders', icon: <IconClipboardList size={size} />, roles: RoleGroups.FIELD_STAFF },
      { label: 'My lockers', to: '/my-lockers', icon: <IconLockAccess size={size} />, roles: ['STUDENT'] },
    ],
  },
  {
    title: 'Facilities',
    items: [
      { label: 'Lockers', to: '/lockers', icon: <IconLock size={size} />, roles: RoleGroups.MANAGEMENT },
      { label: 'Assets', to: '/assets', icon: <IconBuildingWarehouse size={size} />, roles: RoleGroups.FIELD_STAFF },
      { label: 'Preventive maintenance', to: '/maintenance', icon: <IconCalendarRepeat size={size} />, roles: RoleGroups.FIELD_STAFF },
      { label: 'Inventory', to: '/inventory', icon: <IconBox size={size} />, roles: RoleGroups.FIELD_STAFF },
      { label: 'Technicians', to: '/technicians', icon: <IconTool size={size} />, roles: RoleGroups.MANAGEMENT },
    ],
  },
  {
    title: 'Management',
    items: [
      { label: 'Reports', to: '/reports', icon: <IconChartBar size={size} />, roles: RoleGroups.MANAGEMENT },
      { label: 'Users', to: '/admin/users', icon: <IconUsers size={size} />, roles: ['ADMIN'] },
      { label: 'Audit log', to: '/admin/audit', icon: <IconHistory size={size} />, roles: RoleGroups.MANAGEMENT },
      { label: 'SLA settings', to: '/admin/sla', icon: <IconSettings size={size} />, roles: RoleGroups.MANAGEMENT },
    ],
  },
];

export const ACCOUNT_ICON = <IconUserCog size={16} />;
