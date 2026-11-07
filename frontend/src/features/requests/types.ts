import type { PageParams } from '@/api/types';
import type { Attachment, BuildingRef, RoomRef, UserRef } from '@/shared/types/common';
import type { ContactMethod, Priority, RequestCategory, RequestStatus, Severity, SlaState, Urgency } from '@/shared/types/enums';

export type RequestAction = 'ACKNOWLEDGE' | 'REJECT' | 'CREATE_WORK_ORDER' | 'CONFIRM_RESOLUTION' | 'REOPEN' | 'CLOSE' | 'ADD_ATTACHMENTS';

export interface ServiceRequest {
  id: string;
  code: string;
  title: string;
  category: RequestCategory;
  severity: Severity;
  urgency: Urgency;
  priority: Priority;
  isSafetyRelated: boolean;
  status: RequestStatus;
  building: BuildingRef;
  room: RoomRef | null;
  asset: { id: string; code: string; name: string } | null;
  requester: UserRef;
  createdAt: string;
  responseDueAt: string;
  resolutionDueAt: string;
  resolvedAt: string | null;
  slaState: SlaState;
  isEscalated: boolean;
  attachmentCount: number;
}

export interface StatusHistoryEntry {
  fromStatus: RequestStatus | null;
  toStatus: RequestStatus;
  note: string | null;
  changedBy: string;
  changedByRole: string;
  changedAt: string;
}

export interface RequestWorkOrderSummary {
  id: string;
  code: string;
  status: string;
  technician: { id: string; fullName: string } | null;
  dueAt: string;
}

export interface ServiceRequestDetail extends ServiceRequest {
  description: string;
  locationDetails: string | null;
  preferredContact: ContactMethod;
  contactDetail: string | null;
  rejectionReason: string | null;
  acknowledgedAt: string | null;
  closedAt: string | null;
  attachments: Attachment[];
  history: StatusHistoryEntry[];
  workOrders: RequestWorkOrderSummary[];
  feedback: { rating: number; comment: string | null; createdAt: string } | null;
  availableActions: RequestAction[];
}

export interface RequestQuery extends PageParams {
  search?: string;
  status?: RequestStatus;
  category?: RequestCategory;
  priority?: Priority;
  buildingId?: string;
  openOnly?: boolean;
  overdueOnly?: boolean;
  escalatedOnly?: boolean;
  mine?: boolean;
}

export interface CreateRequestInput {
  title: string;
  description: string;
  category: RequestCategory;
  severity: Severity;
  urgency: Urgency;
  isSafetyRelated?: boolean;
  buildingId: string;
  roomId?: string;
  assetId?: string;
  locationDetails?: string;
  preferredContact?: ContactMethod;
  contactDetail?: string;
}

export interface TechnicianSuggestion {
  userId: string;
  fullName: string;
  score: number;
  openWorkOrders: number;
  reasons: string[];
  isRecommended: boolean;
}

export interface CreateWorkOrderFromRequestInput {
  requestId: string;
  technicianId?: string;
  requiresMaterialApproval?: boolean;
  dueAt?: string;
}

export interface AssetOption {
  id: string;
  code: string;
  name: string;
}
