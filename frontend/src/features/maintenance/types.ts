import type { IntervalUnit, Priority } from '@/shared/types/enums';

export interface Schedule {
  id: string;
  title: string;
  description: string | null;
  asset: { id: string; code: string; name: string; building: { id: string; code: string; name: string } };
  intervalValue: number;
  intervalUnit: IntervalUnit;
  every: string;
  nextDueDate: string;
  leadDays: number;
  priority: Priority;
  defaultTechnicianId: string | null;
  isActive: boolean;
  isDueForGeneration: boolean;
  openWorkOrders: number;
  lastGeneratedAt: string | null;
}

export interface ScheduleInput {
  assetId: string;
  title: string;
  description?: string;
  intervalValue: number;
  intervalUnit: IntervalUnit;
  nextDueDate: string;
  leadDays?: number;
  priority?: Priority;
  defaultTechnicianId?: string | null;
}

export type ScheduleUpdate = Partial<Omit<ScheduleInput, 'assetId'>> & { isActive?: boolean };

export interface GenerationResult {
  generated: number;
  workOrders: { id: string; code: string; title: string }[];
}
