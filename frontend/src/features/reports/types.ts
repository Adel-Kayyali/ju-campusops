export interface CountByKey {
  key: string;
  count: number;
}

export interface CategoryPerformance {
  category: string;
  requests: number;
  resolved: number;
  averageResolutionHours: number | null;
  slaCompliance: number | null;
}

export interface BuildingWorkload {
  buildingId: string;
  building: string;
  requestsInPeriod: number;
  openNow: number;
}

export interface TechnicianWorkload {
  technicianId: string;
  fullName: string;
  openWorkOrders: number;
  completedInPeriod: number;
  averageCompletionHours: number | null;
  onTimeRate: number | null;
}

export interface RepeatFailure {
  assetId: string;
  code: string;
  name: string;
  type: string;
  building: string;
  correctiveWorkOrders: number;
}

export interface WeeklyTrend {
  weekStart: string;
  created: number;
  resolved: number;
}

export interface PerformanceReport {
  from: string;
  to: string;
  totalRequests: number;
  resolvedRequests: number;
  unresolvedRequests: number;
  averageResolutionHours: number | null;
  slaCompliance: number | null;
  satisfactionAverage: number | null;
  ratingDistribution: CountByKey[];
  byCategory: CategoryPerformance[];
  byBuilding: BuildingWorkload[];
  technicians: TechnicianWorkload[];
  repeatFailures: RepeatFailure[];
  weeklyTrend: WeeklyTrend[];
}

export interface ReportPeriod {
  from: string;
  to: string;
}
