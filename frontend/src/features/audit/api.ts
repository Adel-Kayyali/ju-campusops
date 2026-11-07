import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { http } from '@/api/httpClient';
import { cleanParams, type Page, type PageParams } from '@/api/types';

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  actor: { id: string; fullName: string; role: string } | null;
  createdAt: string;
}

export interface AuditQuery extends PageParams {
  entityType?: string;
  entityId?: string;
  actorId?: string;
  action?: string;
  from?: string;
  to?: string;
}

export const auditKeys = {
  all: ['audit-logs'] as const,
  list: (query: AuditQuery) => [...auditKeys.all, query] as const,
};

export const auditApi = {
  search: (query: AuditQuery) => http.get<Page<AuditLog>>('/audit-logs', cleanParams(query)),
};

export function useAuditLogs(query: AuditQuery) {
  return useQuery({ queryKey: auditKeys.list(query), queryFn: () => auditApi.search(query), placeholderData: keepPreviousData });
}

/** Entity types written by the backend's AuditService. */
export const AUDIT_ENTITY_TYPES = [
  'User',
  'Building',
  'Room',
  'Locker',
  'LockerSubscription',
  'ServiceRequest',
  'WorkOrder',
  'TechnicianProfile',
  'Asset',
  'PreventiveSchedule',
  'InventoryItem',
  'ProcurementRequest',
  'SlaPolicy',
];
