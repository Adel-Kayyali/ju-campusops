import type { PageParams } from '@/api/types';
import type { BuildingRef, RoomRef } from '@/shared/types/common';
import type { AssetStatus, AssetType, Priority, WarrantyStatus } from '@/shared/types/enums';

export interface Asset {
  id: string;
  code: string;
  name: string;
  type: AssetType;
  status: AssetStatus;
  building: BuildingRef;
  room: RoomRef | null;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  installDate: string | null;
  warrantyExpiry: string | null;
  warrantyStatus: WarrantyStatus;
  notes: string | null;
  openWorkOrders: number;
}

export interface MaintenanceRecord {
  workOrderId: string;
  code: string;
  type: string;
  title: string;
  status: string;
  technician: string | null;
  createdAt: string;
  completedAt: string | null;
  repairNotes: string | null;
}

export interface AssetScheduleSummary {
  id: string;
  title: string;
  every: string;
  nextDueDate: string;
  isActive: boolean;
}

export interface AssetDetail {
  asset: Asset;
  maintenanceHistory: MaintenanceRecord[];
  schedules: AssetScheduleSummary[];
  failuresLast90Days: number;
}

export interface AssetQuery extends PageParams {
  search?: string;
  buildingId?: string;
  roomId?: string;
  type?: AssetType;
  status?: AssetStatus;
  warranty?: WarrantyStatus;
}

export interface AssetInput {
  code: string;
  name: string;
  type: AssetType;
  status?: AssetStatus;
  buildingId: string;
  roomId?: string | null;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  installDate?: string;
  warrantyExpiry?: string;
  notes?: string;
}

export interface AssetWorkOrderInput {
  assetId: string;
  title: string;
  description?: string;
  priority: Priority;
  technicianId?: string;
  requiresMaterialApproval?: boolean;
}

/** Repeat-failure threshold, same as the reports module of the backend. */
export const REPEAT_FAILURE_THRESHOLD = 2;
