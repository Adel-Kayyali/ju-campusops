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

export interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
  user: CurrentUser;
}
