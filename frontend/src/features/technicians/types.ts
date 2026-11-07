import type { BuildingRef } from '@/shared/types/common';
import type { RequestCategory } from '@/shared/types/enums';

export interface Technician {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  skills: RequestCategory[];
  homeBuilding: BuildingRef | null;
  isAvailable: boolean;
  maxOpenOrders: number;
  openWorkOrders: number;
}

export interface TechnicianProfileInput {
  skills?: RequestCategory[];
  homeBuildingId?: string | null;
  isAvailable?: boolean;
  maxOpenOrders?: number;
}
