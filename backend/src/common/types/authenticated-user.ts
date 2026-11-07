import { Role } from '@prisma/client';

/** The identity extracted from a valid JWT and attached to every request. */
export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}
