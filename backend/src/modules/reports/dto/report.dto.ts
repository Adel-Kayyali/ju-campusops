import { IsDateString, IsOptional } from 'class-validator';
import { LockerSummaryDto } from '../../lockers/dto/locker.dto';

export class ReportQueryDto {
  /** Inclusive start date (YYYY-MM-DD). Default: 30 days ago. */
  @IsOptional() @IsDateString() from?: string;
  /** Inclusive end date (YYYY-MM-DD). Default: today. */
  @IsOptional() @IsDateString() to?: string;
}

export class CountByKeyDto {
  key: string;
  count: number;
}

export class RecentRequestDto {
  id: string;
  code: string;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
  resolutionDueAt: string;
  isEscalated: boolean;
}

export class ManagementOverviewDto {
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
  openRequestsByPriority: CountByKeyDto[];
  requestsByStatus: CountByKeyDto[];
  recentRequests: RecentRequestDto[];
  lockers: LockerSummaryDto;
}

export class PersonalWorkItemDto {
  id: string;
  code: string;
  title: string;
  status: string;
  priority: string;
  dueAt: string;
}

export class PersonalOverviewDto {
  openRequests: number;
  resolvedAwaitingConfirmation: number;
  activeLockers: number;
  recentRequests: RecentRequestDto[];
  /** Technicians only. */
  activeWorkOrders: number;
  overdueWorkOrders: number;
  myWorkOrders: PersonalWorkItemDto[];
}

export class CategoryPerformanceDto {
  category: string;
  requests: number;
  resolved: number;
  averageResolutionHours: number | null;
  slaCompliance: number | null;
}

export class BuildingWorkloadDto {
  buildingId: string;
  building: string;
  requestsInPeriod: number;
  openNow: number;
}

export class TechnicianWorkloadDto {
  technicianId: string;
  fullName: string;
  openWorkOrders: number;
  completedInPeriod: number;
  averageCompletionHours: number | null;
  onTimeRate: number | null;
}

export class RepeatFailureDto {
  assetId: string;
  code: string;
  name: string;
  type: string;
  building: string;
  correctiveWorkOrders: number;
}

export class WeeklyTrendDto {
  weekStart: string;
  created: number;
  resolved: number;
}

export class PerformanceReportDto {
  from: string;
  to: string;
  totalRequests: number;
  resolvedRequests: number;
  unresolvedRequests: number;
  averageResolutionHours: number | null;
  slaCompliance: number | null;
  satisfactionAverage: number | null;
  ratingDistribution: CountByKeyDto[];
  byCategory: CategoryPerformanceDto[];
  byBuilding: BuildingWorkloadDto[];
  technicians: TechnicianWorkloadDto[];
  repeatFailures: RepeatFailureDto[];
  weeklyTrend: WeeklyTrendDto[];
}
