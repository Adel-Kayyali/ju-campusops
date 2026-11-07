import type { LockerSummary } from '@/features/lockers/types';
import type { Priority, RequestStatus, WorkOrderStatus } from '@/shared/types/enums';

export interface CountByKey {
  key: string;
  count: number;
}

export interface RecentRequest {
  id: string;
  code: string;
  title: string;
  status: RequestStatus;
  priority: Priority;
  createdAt: string;
  resolutionDueAt: string;
  isEscalated: boolean;
}

export interface ManagementOverview {
  openRequests: number;
  unassignedRequests: number;
  overdueRequests: number;
  escalatedRequests: number;
  activeWorkOrders: number;
  blockedWorkOrders: number;
  overdueWorkOrders: number;
  averageResolutionHours30d: number | null;
  satisfactionAverage30d: number | null;
  lowStockItems: number;
  pendingProcurements: number;
  openRequestsByPriority: CountByKey[];
  requestsByStatus: CountByKey[];
  recentRequests: RecentRequest[];
  lockers: LockerSummary;
}

export interface PersonalWorkItem {
  id: string;
  code: string;
  title: string;
  status: WorkOrderStatus;
  priority: Priority;
  dueAt: string;
}

export interface PersonalOverview {
  openRequests: number;
  resolvedAwaitingConfirmation: number;
  activeLockers: number;
  recentRequests: RecentRequest[];
  activeWorkOrders: number;
  overdueWorkOrders: number;
  myWorkOrders: PersonalWorkItem[];
}
