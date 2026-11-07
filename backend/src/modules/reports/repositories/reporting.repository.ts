import { Injectable } from '@nestjs/common';
import { Prisma, RequestStatus, WorkOrderStatus, WorkOrderType } from '@prisma/client';
import { BaseRepository } from '../../../database/base.repository';
import { TransactionManager } from '../../../database/transaction-manager';

/** Read-only queries used by dashboards and reports. */
@Injectable()
export class ReportingRepository extends BaseRepository {
  constructor(transactionManager: TransactionManager) {
    super(transactionManager);
  }

  countRequests(where: Prisma.ServiceRequestWhereInput): Promise<number> {
    return this.db.serviceRequest.count({ where });
  }

  requestsByStatus(where: Prisma.ServiceRequestWhereInput) {
    return this.db.serviceRequest.groupBy({ by: ['status'], where, _count: { _all: true } });
  }

  requestsByPriority(where: Prisma.ServiceRequestWhereInput) {
    return this.db.serviceRequest.groupBy({ by: ['priority'], where, _count: { _all: true } });
  }

  requestsCreatedBetween(from: Date, to: Date) {
    return this.db.serviceRequest.findMany({
      where: { createdAt: { gte: from, lt: to } },
      select: {
        id: true,
        category: true,
        status: true,
        createdAt: true,
        resolvedAt: true,
        resolutionDueAt: true,
        building: { select: { id: true, code: true, name: true } },
        feedback: { select: { rating: true } },
      },
    });
  }

  requestsResolvedBetween(from: Date, to: Date) {
    return this.db.serviceRequest.findMany({
      where: { resolvedAt: { gte: from, lt: to } },
      select: { resolvedAt: true },
    });
  }

  openRequestsWithBuilding(openStatuses: RequestStatus[]) {
    return this.db.serviceRequest.findMany({
      where: { status: { in: openStatuses } },
      select: { building: { select: { id: true, code: true, name: true } } },
    });
  }

  recentRequests(where: Prisma.ServiceRequestWhereInput, take: number) {
    return this.db.serviceRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      select: { id: true, code: true, title: true, status: true, priority: true, createdAt: true, resolutionDueAt: true, escalatedAt: true },
    });
  }

  averageRating(where: Prisma.RequestFeedbackWhereInput) {
    return this.db.requestFeedback.aggregate({ where, _avg: { rating: true }, _count: { _all: true } });
  }

  ratingDistribution(where: Prisma.RequestFeedbackWhereInput) {
    return this.db.requestFeedback.groupBy({ by: ['rating'], where, _count: { _all: true } });
  }

  countWorkOrders(where: Prisma.WorkOrderWhereInput): Promise<number> {
    return this.db.workOrder.count({ where });
  }

  workOrdersForTechnicianReport(from: Date, to: Date) {
    return this.db.user.findMany({
      where: { role: 'TECHNICIAN', isActive: true },
      select: {
        id: true,
        fullName: true,
        assignedWorkOrders: {
          where: { OR: [{ status: { in: [WorkOrderStatus.OPEN, WorkOrderStatus.IN_PROGRESS] } }, { completedAt: { gte: from, lt: to } }] },
          select: { status: true, startedAt: true, createdAt: true, completedAt: true, dueAt: true },
        },
      },
      orderBy: { fullName: 'asc' },
    });
  }

  correctiveWorkOrdersByAsset(from: Date, to: Date) {
    return this.db.workOrder.groupBy({
      by: ['assetId'],
      where: { type: WorkOrderType.CORRECTIVE, assetId: { not: null }, createdAt: { gte: from, lt: to } },
      _count: { _all: true },
    });
  }

  assetsByIds(ids: string[]) {
    return this.db.asset.findMany({
      where: { id: { in: ids } },
      select: { id: true, code: true, name: true, type: true, building: { select: { code: true, name: true } } },
    });
  }

  myWorkOrders(technicianId: string, take: number) {
    return this.db.workOrder.findMany({
      where: { technicianId, status: { in: [WorkOrderStatus.OPEN, WorkOrderStatus.IN_PROGRESS] } },
      orderBy: { dueAt: 'asc' },
      take,
      select: { id: true, code: true, title: true, status: true, priority: true, dueAt: true },
    });
  }

  countLowStockItems(): Promise<number> {
    return this.db.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count FROM "inventory_items" i
      WHERE i."quantity_on_hand" - COALESCE((
        SELECT SUM(m."quantity") FROM "material_requirements" m WHERE m."item_id" = i."id" AND m."status" = 'RESERVED'
      ), 0) <= i."reorder_level"`.then((rows) => Number(rows[0]?.count ?? 0));
  }

  countPendingProcurements(): Promise<number> {
    return this.db.procurementRequest.count({ where: { status: 'PENDING_APPROVAL' } });
  }

  countActiveLockersOf(studentId: string, today: Date): Promise<number> {
    return this.db.lockerSubscription.count({ where: { studentId, status: 'ACTIVE', endDate: { gte: today } } });
  }
}
