import { Role } from '@prisma/client';

/** Named groups of roles, so access rules read like the requirements document. */
export const RoleGroups = {
  /** Facility managers (coordinators) and system administrators. */
  MANAGEMENT: [Role.FACILITY_MANAGER, Role.ADMIN],
  /** People who report problems. */
  REQUESTERS: [Role.STUDENT, Role.STAFF, Role.TEACHER],
  /** People who do maintenance work. */
  FIELD_STAFF: [Role.TECHNICIAN, Role.FACILITY_MANAGER, Role.ADMIN],
  ALL: [Role.STUDENT, Role.STAFF, Role.TEACHER, Role.TECHNICIAN, Role.FACILITY_MANAGER, Role.ADMIN],
} as const satisfies Record<string, readonly Role[]>;

export function isManagement(role: Role): boolean {
  return (RoleGroups.MANAGEMENT as readonly Role[]).includes(role);
}
