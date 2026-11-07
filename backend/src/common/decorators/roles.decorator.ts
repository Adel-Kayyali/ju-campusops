import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/** Restricts an endpoint (or a whole controller) to the given roles. */
export const Roles = (...roles: readonly Role[]) => SetMetadata(ROLES_KEY, roles);
