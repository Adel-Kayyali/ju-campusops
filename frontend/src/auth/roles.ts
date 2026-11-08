import type { Role } from '@/shared/types/enums';

/** Same role groups as the backend (common/security/role-groups.ts). */
export const RoleGroups = {
  MANAGEMENT: ['FACILITY_MANAGER', 'ADMIN'],
  REQUESTERS: ['STUDENT', 'STAFF', 'TEACHER'],
  FIELD_STAFF: ['TECHNICIAN', 'FACILITY_MANAGER', 'ADMIN'],
  ALL: ['STUDENT', 'STAFF', 'TEACHER', 'TECHNICIAN', 'FACILITY_MANAGER', 'ADMIN'],
} as const satisfies Record<string, readonly Role[]>;

export function hasAnyRole(role: Role | undefined, allowed: readonly Role[]): boolean {
  return role !== undefined && allowed.includes(role);
}

export function isManagement(role: Role | undefined): boolean {
  return hasAnyRole(role, RoleGroups.MANAGEMENT);
}
