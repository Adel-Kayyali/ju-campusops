import { Injectable } from '@nestjs/common';
import { Prisma, PreventiveSchedule, WorkOrderStatus } from '@prisma/client';
import { BaseRepository } from '../../../database/base.repository';
import { TransactionManager } from '../../../database/transaction-manager';

export const scheduleInclude = {
  asset: { select: { id: true, code: true, name: true, building: { select: { id: true, code: true, name: true } } } },
  _count: { select: { workOrders: { where: { status: { in: [WorkOrderStatus.OPEN, WorkOrderStatus.IN_PROGRESS] } } } } },
} satisfies Prisma.PreventiveScheduleInclude;

export type ScheduleWithAsset = Prisma.PreventiveScheduleGetPayload<{ include: typeof scheduleInclude }>;

@Injectable()
export class ScheduleRepository extends BaseRepository {
  constructor(transactionManager: TransactionManager) {
    super(transactionManager);
  }

  findById(id: string): Promise<ScheduleWithAsset | null> {
    return this.db.preventiveSchedule.findUnique({ where: { id }, include: scheduleInclude });
  }

  findAll(where: Prisma.PreventiveScheduleWhereInput): Promise<ScheduleWithAsset[]> {
    return this.db.preventiveSchedule.findMany({ where, include: scheduleInclude, orderBy: { nextDueDate: 'asc' } });
  }

  findActiveDueBy(latestDueDate: Date): Promise<ScheduleWithAsset[]> {
    return this.findAll({ isActive: true, nextDueDate: { lte: latestDueDate } });
  }

  create(data: Prisma.PreventiveScheduleUncheckedCreateInput): Promise<PreventiveSchedule> {
    return this.db.preventiveSchedule.create({ data });
  }

  update(id: string, data: Prisma.PreventiveScheduleUncheckedUpdateInput): Promise<PreventiveSchedule> {
    return this.db.preventiveSchedule.update({ where: { id }, data });
  }
}
