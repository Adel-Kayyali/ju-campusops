import { Injectable } from '@nestjs/common';
import { MaterialStatus, Prisma, TaskStatus, WorkOrder, WorkOrderTask } from '@prisma/client';
import { BaseRepository } from '../../../database/base.repository';
import { TransactionManager } from '../../../database/transaction-manager';
import { TaskBlueprint } from '../domain/task-plan';

export const workOrderListInclude = {
  technician: { select: { id: true, fullName: true } },
  asset: { select: { id: true, code: true, name: true } },
  request: {
    select: {
      id: true,
      code: true,
      title: true,
      status: true,
      category: true,
      building: { select: { id: true, code: true, name: true } },
      room: { select: { id: true, code: true, name: true } },
    },
  },
  _count: { select: { materials: { where: { status: MaterialStatus.SHORTAGE } } } },
} satisfies Prisma.WorkOrderInclude;

export type WorkOrderListItem = Prisma.WorkOrderGetPayload<{ include: typeof workOrderListInclude }>;

export const workOrderDetailInclude = {
  ...workOrderListInclude,
  asset: { select: { id: true, code: true, name: true, building: { select: { id: true, code: true, name: true } } } },
  request: {
    select: {
      id: true,
      code: true,
      title: true,
      status: true,
      category: true,
      description: true,
      requesterId: true,
      building: { select: { id: true, code: true, name: true } },
      room: { select: { id: true, code: true, name: true } },
      requester: { select: { id: true, fullName: true, universityId: true, email: true } },
    },
  },
  createdBy: { select: { fullName: true } },
  tasks: {
    include: { dependsOn: { select: { sequence: true } }, completedBy: { select: { fullName: true } } },
    orderBy: { sequence: 'asc' },
  },
  attachments: { orderBy: { createdAt: 'asc' } },
  schedule: { select: { id: true, title: true } },
} satisfies Prisma.WorkOrderInclude;

export type WorkOrderDetail = Prisma.WorkOrderGetPayload<{ include: typeof workOrderDetailInclude }>;

export type TaskWithDependencies = WorkOrderTask & { dependsOn: { sequence: number }[] };

@Injectable()
export class WorkOrderRepository extends BaseRepository {
  constructor(transactionManager: TransactionManager) {
    super(transactionManager);
  }

  findById(id: string): Promise<WorkOrder | null> {
    return this.db.workOrder.findUnique({ where: { id } });
  }

  findDetail(id: string): Promise<WorkOrderDetail | null> {
    return this.db.workOrder.findUnique({ where: { id }, include: workOrderDetailInclude });
  }

  async findPage(
    where: Prisma.WorkOrderWhereInput,
    orderBy: Prisma.WorkOrderOrderByWithRelationInput,
    skip: number,
    take: number,
  ): Promise<[WorkOrderListItem[], number]> {
    return Promise.all([
      this.db.workOrder.findMany({ where, include: workOrderListInclude, orderBy, skip, take }),
      this.db.workOrder.count({ where }),
    ]);
  }

  findByRequest(requestId: string): Promise<WorkOrder[]> {
    return this.db.workOrder.findMany({ where: { requestId }, orderBy: { createdAt: 'desc' } });
  }

  create(data: Prisma.WorkOrderUncheckedCreateInput): Promise<WorkOrder> {
    return this.db.workOrder.create({ data });
  }

  update(id: string, data: Prisma.WorkOrderUncheckedUpdateInput): Promise<WorkOrder> {
    return this.db.workOrder.update({ where: { id }, data });
  }

  /** Creates the tasks first, then links each one to its prerequisites. */
  async createTasks(workOrderId: string, plan: readonly TaskBlueprint[]): Promise<void> {
    const idsBySequence = new Map<number, string>();
    for (const blueprint of plan) {
      const task = await this.db.workOrderTask.create({
        data: { workOrderId, sequence: blueprint.sequence, type: blueprint.type, title: blueprint.title },
      });
      idsBySequence.set(blueprint.sequence, task.id);
    }
    for (const blueprint of plan.filter((b) => b.dependsOn.length > 0)) {
      await this.db.workOrderTask.update({
        where: { id: idsBySequence.get(blueprint.sequence)! },
        data: { dependsOn: { connect: blueprint.dependsOn.map((sequence) => ({ id: idsBySequence.get(sequence)! })) } },
      });
    }
  }

  findTasks(workOrderId: string): Promise<TaskWithDependencies[]> {
    return this.db.workOrderTask.findMany({
      where: { workOrderId },
      include: { dependsOn: { select: { sequence: true } } },
      orderBy: { sequence: 'asc' },
    });
  }

  updateTask(id: string, data: Prisma.WorkOrderTaskUncheckedUpdateInput): Promise<WorkOrderTask> {
    return this.db.workOrderTask.update({ where: { id }, data });
  }

  updateTasksByType(workOrderId: string, types: WorkOrderTask['type'][], fromStatuses: TaskStatus[], data: Prisma.WorkOrderTaskUncheckedUpdateManyInput): Promise<Prisma.BatchPayload> {
    return this.db.workOrderTask.updateMany({ where: { workOrderId, type: { in: types }, status: { in: fromStatuses } }, data });
  }
}
