import { Injectable } from '@nestjs/common';
import { Prisma, RequestStatus, ServiceRequest, WorkOrderStatus } from '@prisma/client';
import { BaseRepository } from '../../../database/base.repository';
import { TransactionManager } from '../../../database/transaction-manager';

export const requestListInclude = {
  building: { select: { id: true, code: true, name: true } },
  room: { select: { id: true, code: true, name: true } },
  asset: { select: { id: true, code: true, name: true } },
  requester: { select: { id: true, fullName: true, universityId: true, email: true } },
  _count: { select: { attachments: true } },
} satisfies Prisma.ServiceRequestInclude;

export type RequestListItem = Prisma.ServiceRequestGetPayload<{ include: typeof requestListInclude }>;

export const requestDetailInclude = {
  ...requestListInclude,
  attachments: { orderBy: { createdAt: 'asc' } },
  statusHistory: { include: { changedBy: { select: { fullName: true, role: true } } }, orderBy: { changedAt: 'asc' } },
  workOrders: { include: { technician: { select: { id: true, fullName: true } } }, orderBy: { createdAt: 'desc' } },
  feedback: true,
} satisfies Prisma.ServiceRequestInclude;

export type RequestDetail = Prisma.ServiceRequestGetPayload<{ include: typeof requestDetailInclude }>;

const ACTIVE_WORK_ORDER = { status: { notIn: [WorkOrderStatus.CANCELLED] } };

@Injectable()
export class ServiceRequestRepository extends BaseRepository {
  constructor(transactionManager: TransactionManager) {
    super(transactionManager);
  }

  findById(id: string): Promise<ServiceRequest | null> {
    return this.db.serviceRequest.findUnique({ where: { id } });
  }

  findDetail(id: string): Promise<RequestDetail | null> {
    return this.db.serviceRequest.findUnique({ where: { id }, include: requestDetailInclude });
  }

  async findPage(
    where: Prisma.ServiceRequestWhereInput,
    orderBy: Prisma.ServiceRequestOrderByWithRelationInput,
    skip: number,
    take: number,
  ): Promise<[RequestListItem[], number]> {
    return Promise.all([
      this.db.serviceRequest.findMany({ where, include: requestListInclude, orderBy, skip, take }),
      this.db.serviceRequest.count({ where }),
    ]);
  }

  create(data: Prisma.ServiceRequestUncheckedCreateInput): Promise<ServiceRequest> {
    return this.db.serviceRequest.create({ data });
  }

  update(id: string, data: Prisma.ServiceRequestUncheckedUpdateInput): Promise<ServiceRequest> {
    return this.db.serviceRequest.update({ where: { id }, data });
  }

  addHistory(data: Prisma.RequestStatusHistoryUncheckedCreateInput): Promise<unknown> {
    return this.db.requestStatusHistory.create({ data });
  }

  createFeedback(data: Prisma.RequestFeedbackUncheckedCreateInput): Promise<unknown> {
    return this.db.requestFeedback.create({ data });
  }

  hasActiveWorkOrder(requestId: string): Promise<boolean> {
    return this.db.workOrder.count({ where: { requestId, ...ACTIVE_WORK_ORDER } }).then((count) => count > 0);
  }

  isAssignedTechnician(requestId: string, technicianId: string): Promise<boolean> {
    return this.db.workOrder.count({ where: { requestId, technicianId } }).then((count) => count > 0);
  }

  /** Open requests past their resolution deadline (or safety ones past the response deadline) not escalated yet. */
  findNewlyOverdue(now: Date, openStatuses: readonly RequestStatus[]): Promise<ServiceRequest[]> {
    return this.db.serviceRequest.findMany({
      where: {
        escalatedAt: null,
        status: { in: [...openStatuses] },
        OR: [
          { resolutionDueAt: { lt: now } },
          { isSafetyRelated: true, status: RequestStatus.SUBMITTED, responseDueAt: { lt: now } },
        ],
      },
    });
  }
}
