import type { PageParams } from '@/api/types';
import type { Attachment, BuildingRef, RoomRef, UserRef } from '@/shared/types/common';
import type { MaterialStatus, Priority, TaskStatus, TaskType, WorkOrderStatus, WorkOrderType } from '@/shared/types/enums';

export type WorkOrderAction = 'ASSIGN' | 'CANCEL' | 'VERIFY' | 'ADD_MATERIAL' | 'ADD_EVIDENCE';

export interface WorkOrder {
  id: string;
  code: string;
  type: WorkOrderType;
  title: string;
  priority: Priority;
  status: WorkOrderStatus;
  technician: { id: string; fullName: string } | null;
  asset: { id: string; code: string; name: string } | null;
  request: { id: string; code: string; title: string; status: string } | null;
  building: BuildingRef | null;
  room: RoomRef | null;
  dueAt: string;
  isOverdue: boolean;
  isBlocked: boolean;
  createdAt: string;
  completedAt: string | null;
}

export interface WorkOrderTask {
  id: string;
  sequence: number;
  type: TaskType;
  title: string;
  status: TaskStatus;
  notes: string | null;
  dependsOn: number[];
  completedAt: string | null;
  completedBy: string | null;
  isUnlocked: boolean;
}

export interface Material {
  id: string;
  item: { id: string; sku: string; name: string; unit: string };
  quantity: number;
  status: MaterialStatus;
  workOrder: { id: string; code: string; title: string };
  createdAt: string;
}

export interface WorkOrderDetail extends WorkOrder {
  description: string | null;
  repairNotes: string | null;
  requester: UserRef | null;
  createdBy: string | null;
  schedule: { id: string; title: string } | null;
  startedAt: string | null;
  verifiedAt: string | null;
  tasks: WorkOrderTask[];
  materials: Material[];
  attachments: Attachment[];
  availableActions: WorkOrderAction[];
}

export interface WorkOrderQuery extends PageParams {
  search?: string;
  status?: WorkOrderStatus;
  type?: WorkOrderType;
  priority?: Priority;
  technicianId?: string;
  assetId?: string;
  activeOnly?: boolean;
  blockedOnly?: boolean;
  overdueOnly?: boolean;
}

/** Minimal views of other modules used by the work-order screens. */
export interface TechnicianOption {
  id: string;
  fullName: string;
  isActive: boolean;
  isAvailable: boolean;
  openWorkOrders: number;
  maxOpenOrders: number;
}

export interface InventoryItemOption {
  id: string;
  sku: string;
  name: string;
  unit: string;
  availableQuantity: number;
}

/** Task types whose completion requires repair notes (same rule as the backend). */
export const NOTES_REQUIRED_TASKS: TaskType[] = ['REPAIR', 'PREVENTIVE_CHECK'];
