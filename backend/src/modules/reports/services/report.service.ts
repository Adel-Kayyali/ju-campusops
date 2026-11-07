import { Injectable } from '@nestjs/common';
import { RequestStatus, Role, WorkOrderStatus } from '@prisma/client';
import { BusinessRuleViolationException } from '../../../common/exceptions/domain.exceptions';
import { CampusClock } from '../../../common/time/campus-clock';
import { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { DateOnly } from '../../../common/utils/date-only';
import { LockerService } from '../../lockers/services/locker.service';
import { OPEN_REQUEST_STATUSES } from '../../service-requests/domain/request-status.machine';
import { average, groupBy, hoursBetween, percentage, weekStart, weekStartsBetween } from '../domain/report-calculations';
import {
  ManagementOverviewDto,
  PerformanceReportDto,
  PersonalOverviewDto,
  RecentRequestDto,
  ReportQueryDto,
} from '../dto/report.dto';
import { ReportingRepository } from '../repositories/reporting.repository';

const OPEN = [...OPEN_REQUEST_STATUSES];
const ACTIVE_WORK = [WorkOrderStatus.OPEN, WorkOrderStatus.IN_PROGRESS];
/** A repeat failure = this many corrective jobs on the same asset within the period. */
const REPEAT_FAILURE_THRESHOLD = 2;
const MAX_REPORT_DAYS = 366;

/** Service-level monitoring: dashboards and performance reports. */
@Injectable()
export class ReportService {
  constructor(
    private readonly repository: ReportingRepository,
    private readonly lockerService: LockerService,
    private readonly clock: CampusClock,
  ) {}

  async managementOverview(): Promise<ManagementOverviewDto> {
    const now = this.clock.now();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 3_600_000);
    const [
      openRequests,
      unassignedRequests,
      overdueRequests,
      escalatedRequests,
      activeWorkOrders,
      blockedWorkOrders,
      overdueWorkOrders,
      resolvedRecently,
      rating,
      lowStockItems,
      pendingProcurements,
      byPriority,
      byStatus,
      recent,
      lockers,
    ] = await Promise.all([
      this.repository.countRequests({ status: { in: OPEN } }),
      this.repository.countRequests({ status: { in: [RequestStatus.SUBMITTED, RequestStatus.ACKNOWLEDGED] } }),
      this.repository.countRequests({ status: { in: OPEN }, resolutionDueAt: { lt: now } }),
      this.repository.countRequests({ status: { in: OPEN }, escalatedAt: { not: null } }),
      this.repository.countWorkOrders({ status: { in: ACTIVE_WORK } }),
      this.repository.countWorkOrders({ status: { in: ACTIVE_WORK }, materials: { some: { status: 'SHORTAGE' } } }),
      this.repository.countWorkOrders({ status: { in: ACTIVE_WORK }, dueAt: { lt: now } }),
      this.repository.requestsCreatedBetween(thirtyDaysAgo, now),
      this.repository.averageRating({ createdAt: { gte: thirtyDaysAgo } }),
      this.repository.countLowStockItems(),
      this.repository.countPendingProcurements(),
      this.repository.requestsByPriority({ status: { in: OPEN } }),
      this.repository.requestsByStatus({}),
      this.repository.recentRequests({}, 6),
      this.lockerService.summary(),
    ]);

    return {
      openRequests,
      unassignedRequests,
      overdueRequests,
      escalatedRequests,
      activeWorkOrders,
      blockedWorkOrders,
      overdueWorkOrders,
      averageResolutionHours30d: average(resolvedRecently.filter((r) => r.resolvedAt).map((r) => hoursBetween(r.createdAt, r.resolvedAt!))),
      satisfactionAverage30d: rating._avg.rating === null ? null : Math.round(rating._avg.rating * 10) / 10,
      lowStockItems,
      pendingProcurements,
      openRequestsByPriority: byPriority.map((row) => ({ key: row.priority, count: row._count._all })).sort((a, b) => a.key.localeCompare(b.key)),
      requestsByStatus: byStatus.map((row) => ({ key: row.status, count: row._count._all })),
      recentRequests: recent.map(toRecent),
      lockers,
    };
  }

  async personalOverview(user: AuthenticatedUser): Promise<PersonalOverviewDto> {
    const now = this.clock.now();
    const mine = { requesterId: user.id };
    const isTechnician = user.role === Role.TECHNICIAN;
    const [openRequests, awaiting, activeLockers, recent, myWorkOrders] = await Promise.all([
      this.repository.countRequests({ ...mine, status: { in: OPEN } }),
      this.repository.countRequests({ ...mine, status: RequestStatus.RESOLVED }),
      user.role === Role.STUDENT ? this.repository.countActiveLockersOf(user.id, this.clock.today()) : Promise.resolve(0),
      this.repository.recentRequests(mine, 5),
      isTechnician ? this.repository.myWorkOrders(user.id, 20) : Promise.resolve([]),
    ]);
    return {
      openRequests,
      resolvedAwaitingConfirmation: awaiting,
      activeLockers,
      recentRequests: recent.map(toRecent),
      activeWorkOrders: myWorkOrders.length,
      overdueWorkOrders: myWorkOrders.filter((wo) => wo.dueAt < now).length,
      myWorkOrders: myWorkOrders.map((wo) => ({ id: wo.id, code: wo.code, title: wo.title, status: wo.status, priority: wo.priority, dueAt: wo.dueAt.toISOString() })),
    };
  }

  async performance(query: ReportQueryDto): Promise<PerformanceReportDto> {
    const today = this.clock.today();
    const fromDay = query.from ? DateOnly.parse(query.from) : DateOnly.addDays(today, -30);
    const toDay = query.to ? DateOnly.parse(query.to) : today;
    if (toDay < fromDay || DateOnly.daysBetween(fromDay, toDay) > MAX_REPORT_DAYS) {
      throw new BusinessRuleViolationException(`Choose a valid period of at most ${MAX_REPORT_DAYS} days`, 'INVALID_REPORT_PERIOD');
    }
    const from = fromDay;
    const to = DateOnly.addDays(toDay, 1);

    const [requests, resolvedInPeriod, openByBuilding, technicians, repeatGroups, ratings] = await Promise.all([
      this.repository.requestsCreatedBetween(from, to),
      this.repository.requestsResolvedBetween(from, to),
      this.repository.openRequestsWithBuilding(OPEN),
      this.repository.workOrdersForTechnicianReport(from, to),
      this.repository.correctiveWorkOrdersByAsset(from, to),
      this.repository.ratingDistribution({ createdAt: { gte: from, lt: to } }),
    ]);

    const resolved = requests.filter((r) => r.resolvedAt);
    const resolutionHours = (items: typeof requests) => items.filter((r) => r.resolvedAt).map((r) => hoursBetween(r.createdAt, r.resolvedAt!));
    const slaCompliance = (items: typeof requests) => {
      const done = items.filter((r) => r.resolvedAt);
      return percentage(done.filter((r) => r.resolvedAt! <= r.resolutionDueAt).length, done.length);
    };
    const ratingsInPeriod = requests.filter((r) => r.feedback).map((r) => r.feedback!.rating);

    const openCountByBuilding = new Map<string, number>();
    for (const row of openByBuilding) openCountByBuilding.set(row.building.id, (openCountByBuilding.get(row.building.id) ?? 0) + 1);

    const repeat = repeatGroups.filter((g) => g._count._all >= REPEAT_FAILURE_THRESHOLD);
    const assets = await this.repository.assetsByIds(repeat.map((g) => g.assetId!));

    const weeks = weekStartsBetween(from, toDay);
    const createdPerWeek = groupBy(requests, (r) => weekStart(r.createdAt));
    const resolvedPerWeek = groupBy(resolvedInPeriod, (r) => weekStart(r.resolvedAt!));

    return {
      from: DateOnly.format(fromDay),
      to: DateOnly.format(toDay),
      totalRequests: requests.length,
      resolvedRequests: resolved.length,
      unresolvedRequests: requests.filter((r) => OPEN.includes(r.status)).length,
      averageResolutionHours: average(resolutionHours(requests)),
      slaCompliance: slaCompliance(requests),
      satisfactionAverage: average(ratingsInPeriod),
      ratingDistribution: [1, 2, 3, 4, 5].map((stars) => ({ key: String(stars), count: ratings.find((r) => r.rating === stars)?._count._all ?? 0 })),
      byCategory: [...groupBy(requests, (r) => r.category).entries()]
        .map(([category, items]) => ({
          category,
          requests: items.length,
          resolved: items.filter((r) => r.resolvedAt).length,
          averageResolutionHours: average(resolutionHours(items)),
          slaCompliance: slaCompliance(items),
        }))
        .sort((a, b) => b.requests - a.requests),
      byBuilding: [...groupBy(requests, (r) => r.building.id).entries()]
        .map(([buildingId, items]) => ({
          buildingId,
          building: `${items[0].building.code} - ${items[0].building.name}`,
          requestsInPeriod: items.length,
          openNow: openCountByBuilding.get(buildingId) ?? 0,
        }))
        .sort((a, b) => b.requestsInPeriod - a.requestsInPeriod),
      technicians: technicians.map((technician) => {
        const completed = technician.assignedWorkOrders.filter((wo) => wo.completedAt);
        return {
          technicianId: technician.id,
          fullName: technician.fullName,
          openWorkOrders: technician.assignedWorkOrders.filter((wo) => ACTIVE_WORK.includes(wo.status as (typeof ACTIVE_WORK)[number])).length,
          completedInPeriod: completed.length,
          averageCompletionHours: average(completed.map((wo) => hoursBetween(wo.startedAt ?? wo.createdAt, wo.completedAt!))),
          onTimeRate: percentage(completed.filter((wo) => wo.completedAt! <= wo.dueAt).length, completed.length),
        };
      }),
      repeatFailures: repeat
        .map((group) => {
          const asset = assets.find((a) => a.id === group.assetId)!;
          return {
            assetId: asset.id,
            code: asset.code,
            name: asset.name,
            type: asset.type,
            building: `${asset.building.code} - ${asset.building.name}`,
            correctiveWorkOrders: group._count._all,
          };
        })
        .sort((a, b) => b.correctiveWorkOrders - a.correctiveWorkOrders),
      weeklyTrend: weeks.map((week) => ({ weekStart: week, created: createdPerWeek.get(week)?.length ?? 0, resolved: resolvedPerWeek.get(week)?.length ?? 0 })),
    };
  }
}

function toRecent(request: { id: string; code: string; title: string; status: string; priority: string; createdAt: Date; resolutionDueAt: Date; escalatedAt: Date | null }): RecentRequestDto {
  return {
    id: request.id,
    code: request.code,
    title: request.title,
    status: request.status,
    priority: request.priority,
    createdAt: request.createdAt.toISOString(),
    resolutionDueAt: request.resolutionDueAt.toISOString(),
    isEscalated: request.escalatedAt !== null,
  };
}
