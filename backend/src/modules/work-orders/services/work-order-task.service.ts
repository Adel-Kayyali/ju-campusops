import { Injectable } from '@nestjs/common';
import { AssetStatus, TaskStatus, TaskType, WorkOrder, WorkOrderStatus } from '@prisma/client';
import { BusinessRuleViolationException, EntityNotFoundException } from '../../../common/exceptions/domain.exceptions';
import { RoleGroups } from '../../../common/security/role-groups';
import { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { Transactional } from '../../../database/transactional.decorator';
import { AssetService } from '../../assets/services/asset.service';
import { AuditAction } from '../../audit/domain/audit-action';
import { AuditService } from '../../audit/services/audit.service';
import { MaterialAllocationService } from '../../inventory/services/material-allocation.service';
import { NotificationService } from '../../notifications/services/notification.service';
import { RequestWorkflowService } from '../../service-requests/services/request-workflow.service';
import { TaskRules, WORK_TASK_TYPES } from '../domain/task-rules';
import { WorkOrderStatusMachine } from '../domain/work-order-status.machine';
import { WorkOrderDetailDto } from '../dto/work-order.dto';
import { TaskWithDependencies, WorkOrderRepository } from '../repositories/work-order.repository';
import { WorkOrderService } from './work-order.service';

/**
 * Moves work-order tasks forward while enforcing their dependencies, and keeps the
 * work order, the service request and the asset status in sync with the progress.
 */
@Injectable()
export class WorkOrderTaskService {
  constructor(
    private readonly repository: WorkOrderRepository,
    private readonly workOrderService: WorkOrderService,
    private readonly requestWorkflow: RequestWorkflowService,
    private readonly assetService: AssetService,
    private readonly allocationService: MaterialAllocationService,
    private readonly notificationService: NotificationService,
    private readonly auditService: AuditService,
  ) {}

  @Transactional()
  async startTask(workOrderId: string, taskId: string, actor: AuthenticatedUser): Promise<WorkOrderDetailDto> {
    const { workOrder, task, tasks } = await this.load(workOrderId, taskId);
    await this.assertCanWorkOn(workOrder, task, tasks, actor);
    TaskRules.assertCanStart(task);
    await this.repository.updateTask(task.id, { status: TaskStatus.IN_PROGRESS });
    await this.onWorkStarted(workOrder, actor.id);
    await this.recordTaskChange(workOrder, task, TaskStatus.IN_PROGRESS, actor.id);
    return this.workOrderService.findOne(workOrderId, actor);
  }

  @Transactional()
  async completeTask(workOrderId: string, taskId: string, notes: string | undefined, actor: AuthenticatedUser): Promise<WorkOrderDetailDto> {
    const { workOrder, task, tasks } = await this.load(workOrderId, taskId);
    await this.assertCanWorkOn(workOrder, task, tasks, actor);
    TaskRules.assertCanComplete(task);
    const isWorkTask = WORK_TASK_TYPES.includes(task.type);
    if (isWorkTask && !notes?.trim()) {
      throw new BusinessRuleViolationException('Please describe the work that was done (repair notes)', 'REPAIR_NOTES_REQUIRED');
    }

    await this.repository.updateTask(task.id, { status: TaskStatus.DONE, notes: notes ?? null, completedAt: new Date(), completedById: actor.id });
    if (isWorkTask) {
      await this.repository.update(workOrderId, { repairNotes: notes });
    }
    await this.onWorkStarted(workOrder, actor.id);
    await this.recordTaskChange(workOrder, task, TaskStatus.DONE, actor.id);

    if (task.type === TaskType.MATERIAL_APPROVAL) {
      await this.notificationService.notifyUser(workOrder.technicianId, {
        title: `Materials approved for ${workOrder.code}`,
        message: notes ? `Note: ${notes}` : 'You can now proceed with the repair.',
        link: `/work-orders/${workOrderId}`,
      });
    }

    const updatedTasks = tasks.map((t) => (t.id === task.id ? { ...t, status: TaskStatus.DONE } : t));
    if (TaskRules.isWorkComplete(updatedTasks)) {
      await this.completeWorkOrder(await this.workOrderService.getWorkOrder(workOrderId), notes ?? 'Work completed', actor.id);
    }
    return this.workOrderService.findOne(workOrderId, actor);
  }

  /** A manager decides that an optional step (material approval) is not needed. */
  @Transactional()
  async skipTask(workOrderId: string, taskId: string, reason: string, actor: AuthenticatedUser): Promise<WorkOrderDetailDto> {
    const { workOrder, task, tasks } = await this.load(workOrderId, taskId);
    this.workOrderService.assertActive(workOrder);
    if (task.type !== TaskType.MATERIAL_APPROVAL) {
      throw new BusinessRuleViolationException('Only the material approval step can be skipped', 'TASK_NOT_SKIPPABLE');
    }
    TaskRules.assertActorAllowed(task, actor, workOrder.technicianId);
    TaskRules.assertCanComplete(task);
    await this.repository.updateTask(task.id, { status: TaskStatus.SKIPPED, notes: reason, completedAt: new Date(), completedById: actor.id });
    await this.recordTaskChange(workOrder, task, TaskStatus.SKIPPED, actor.id);
    if (TaskRules.isWorkComplete(tasks.map((t) => (t.id === task.id ? { ...t, status: TaskStatus.SKIPPED } : t)))) {
      await this.completeWorkOrder(workOrder, reason, actor.id);
    }
    return this.workOrderService.findOne(workOrderId, actor);
  }

  // ------------------------------------------------- reactions to the request

  /** The requester confirmed the repair: last step done, work order verified. */
  async onRequesterConfirmed(requestId: string, actorId: string): Promise<void> {
    for (const workOrder of await this.completedOrdersOf(requestId)) {
      await this.repository.updateTasksByType(workOrder.id, [TaskType.REQUESTER_CONFIRMATION], [TaskStatus.PENDING, TaskStatus.IN_PROGRESS], {
        status: TaskStatus.DONE,
        completedAt: new Date(),
        completedById: actorId,
      });
      await this.verifyWorkOrder(workOrder, actorId, 'Confirmed by requester');
    }
  }

  /** A manager closed the request without the requester: the confirmation step is skipped. */
  async onRequestClosed(requestId: string, actorId: string): Promise<void> {
    for (const workOrder of await this.completedOrdersOf(requestId)) {
      await this.repository.updateTasksByType(workOrder.id, [TaskType.REQUESTER_CONFIRMATION], [TaskStatus.PENDING, TaskStatus.IN_PROGRESS], {
        status: TaskStatus.SKIPPED,
        notes: 'Request closed by facility manager',
        completedAt: new Date(),
        completedById: actorId,
      });
      await this.verifyWorkOrder(workOrder, actorId, 'Request closed by manager');
    }
  }

  /** The requester says it is still broken: the repair goes back to the technician. */
  async onRequestReopened(requestId: string, actorId: string, reason: string): Promise<void> {
    for (const workOrder of await this.completedOrdersOf(requestId)) {
      WorkOrderStatusMachine.assertTransition(workOrder.status, WorkOrderStatus.IN_PROGRESS);
      await this.repository.update(workOrder.id, { status: WorkOrderStatus.IN_PROGRESS, completedAt: null });
      await this.repository.updateTasksByType(workOrder.id, [TaskType.REPAIR], [TaskStatus.DONE], { status: TaskStatus.IN_PROGRESS, completedAt: null, completedById: null });
      if (workOrder.assetId) await this.assetService.changeStatus(workOrder.assetId, AssetStatus.UNDER_MAINTENANCE);
      await this.notificationService.notifyUser(workOrder.technicianId, {
        title: `${workOrder.code} re-opened by the requester`,
        message: reason,
        link: `/work-orders/${workOrder.id}`,
      });
      await this.workOrderService.recordStatusChange(workOrder, WorkOrderStatus.IN_PROGRESS, actorId, `Re-opened: ${reason}`);
    }
  }

  // ------------------------------------------------------------------ helpers

  private async load(workOrderId: string, taskId: string): Promise<{ workOrder: WorkOrder; task: TaskWithDependencies; tasks: TaskWithDependencies[] }> {
    const workOrder = await this.workOrderService.getWorkOrder(workOrderId);
    const tasks = await this.repository.findTasks(workOrderId);
    const task = tasks.find((t) => t.id === taskId);
    if (!task) {
      throw new EntityNotFoundException('WorkOrderTask', taskId);
    }
    return { workOrder, task, tasks };
  }

  private async assertCanWorkOn(workOrder: WorkOrder, task: TaskWithDependencies, tasks: TaskWithDependencies[], actor: AuthenticatedUser): Promise<void> {
    this.workOrderService.assertActive(workOrder);
    TaskRules.assertActorAllowed(task, actor, workOrder.technicianId);
    if (task.type !== TaskType.MATERIAL_APPROVAL && !workOrder.technicianId) {
      throw new BusinessRuleViolationException('Assign a technician before starting the work', 'NO_TECHNICIAN_ASSIGNED');
    }
    const prerequisiteSequences = new Set(task.dependsOn.map((d) => d.sequence));
    TaskRules.assertPrerequisitesMet(task, tasks.filter((t) => prerequisiteSequences.has(t.sequence)));
    if (WORK_TASK_TYPES.includes(task.type) && (await this.allocationService.hasShortage(workOrder.id))) {
      throw new BusinessRuleViolationException('The repair is blocked until the missing spare parts arrive', 'WAITING_FOR_MATERIALS');
    }
  }

  /** First activity on the job: OPEN -> IN_PROGRESS, request in progress, asset under maintenance. */
  private async onWorkStarted(workOrder: WorkOrder, actorId: string): Promise<void> {
    if (workOrder.status !== WorkOrderStatus.OPEN) return;
    await this.repository.update(workOrder.id, { status: WorkOrderStatus.IN_PROGRESS, startedAt: new Date() });
    await this.workOrderService.recordStatusChange(workOrder, WorkOrderStatus.IN_PROGRESS, actorId);
    if (workOrder.requestId) await this.requestWorkflow.markInProgress(workOrder.requestId, actorId);
    if (workOrder.assetId) await this.assetService.changeStatus(workOrder.assetId, AssetStatus.UNDER_MAINTENANCE);
  }

  private async completeWorkOrder(workOrder: WorkOrder, notes: string, actorId: string): Promise<void> {
    const current = await this.workOrderService.getWorkOrder(workOrder.id);
    WorkOrderStatusMachine.assertTransition(current.status, WorkOrderStatus.COMPLETED);
    await this.repository.update(workOrder.id, { status: WorkOrderStatus.COMPLETED, completedAt: new Date() });
    await this.workOrderService.recordStatusChange(current, WorkOrderStatus.COMPLETED, actorId);
    if (workOrder.assetId) await this.assetService.changeStatus(workOrder.assetId, AssetStatus.OPERATIONAL);
    if (workOrder.requestId) {
      await this.requestWorkflow.markResolved(workOrder.requestId, actorId, notes);
    } else {
      await this.notificationService.notifyRoles([...RoleGroups.MANAGEMENT], {
        title: `${workOrder.code} completed - please verify`,
        message: workOrder.title,
        link: `/work-orders/${workOrder.id}`,
      });
    }
  }

  private async verifyWorkOrder(workOrder: WorkOrder, actorId: string, note: string): Promise<void> {
    await this.repository.update(workOrder.id, { status: WorkOrderStatus.VERIFIED, verifiedAt: new Date() });
    await this.workOrderService.recordStatusChange(workOrder, WorkOrderStatus.VERIFIED, actorId, note);
  }

  private async completedOrdersOf(requestId: string): Promise<WorkOrder[]> {
    return (await this.repository.findByRequest(requestId)).filter((wo) => wo.status === WorkOrderStatus.COMPLETED);
  }

  private recordTaskChange(workOrder: WorkOrder, task: TaskWithDependencies, to: TaskStatus, actorId: string): Promise<void> {
    return this.auditService.record({
      actorId,
      action: AuditAction.WORK_ORDER_TASK_UPDATED,
      entityType: 'WorkOrder',
      entityId: workOrder.id,
      details: { code: workOrder.code, task: `#${task.sequence} ${task.title}`, from: task.status, to },
    });
  }
}
