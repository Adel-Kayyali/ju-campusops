import type { Role } from '@/shared/types/enums';

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  universityId: string | null;
  phone: string | null;
  department: string | null;
  isActive: boolean;
  createdAt: string;
}

/** Sign-up form / API body. Students, staff and teachers can register themselves. */
export interface RegisterInput {
  accountType: 'STUDENT' | 'STAFF' | 'TEACHER';
  fullName: string;
  email: string;
  universityId?: string;
  department?: string;
  phone?: string;
  password: string;
  confirmPassword: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
  user: CurrentUser;
}
