import { Injectable } from '@nestjs/common';
import { AssetStatus, Prisma, Priority, RequestStatus, Role, WorkOrder, WorkOrderStatus, WorkOrderType } from '@prisma/client';
import { PageDto, resolveSort } from '../../../common/dto/page.dto';
import { AccessDeniedException, BusinessRuleViolationException, EntityNotFoundException } from '../../../common/exceptions/domain.exceptions';
import { isManagement, RoleGroups } from '../../../common/security/role-groups';
import { CampusClock } from '../../../common/time/campus-clock';
import { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { SequenceName, SequenceService } from '../../../database/sequence.service';
import { Transactional } from '../../../database/transactional.decorator';
import { AssetService } from '../../assets/services/asset.service';
import { AuditAction } from '../../audit/domain/audit-action';
import { AuditService } from '../../audit/services/audit.service';
import { MaterialAllocationService } from '../../inventory/services/material-allocation.service';
import { NotificationService } from '../../notifications/services/notification.service';
import { RequestWorkflowService } from '../../service-requests/services/request-workflow.service';
import { SlaService } from '../../sla/services/sla.service';
import { IncomingFile } from '../../storage/domain/file-storage';
import { AttachmentDto, AttachmentService } from '../../storage/services/attachment.service';
import { TechnicianService } from '../../technicians/services/technician.service';
import { buildTaskPlan } from '../domain/task-plan';
import { availableWorkOrderActions } from '../domain/work-order-actions';
import { ACTIVE_WORK_ORDER_STATUSES, WorkOrderStatusMachine } from '../domain/work-order-status.machine';
import { CreateWorkOrderDto, WorkOrderDetailDto, WorkOrderQueryDto, WorkOrderResponseDto } from '../dto/work-order.dto';
import { WorkOrderMapper } from '../mappers/work-order.mapper';
import { WorkOrderDetail, WorkOrderRepository } from '../repositories/work-order.repository';

const SORTABLE_FIELDS = ['createdAt', 'dueAt', 'priority', 'status', 'code'] as const;

export interface PreventiveWorkInput {
  scheduleId: string;
  assetId: string;
  title: string;
  description: string | null;
  priority: Priority;
  dueAt: Date;
  technicianId: string | null;
}

/** Work orders: creation (from requests, assets or schedules), assignment, cancellation, verification. */
@Injectable()
export class WorkOrderService {
  constructor(
    private readonly repository: WorkOrderRepository,
    private readonly requestWorkflow: RequestWorkflowService,
    private readonly technicianService: TechnicianService,
    private readonly assetService: AssetService,
    private readonly slaService: SlaService,
    private readonly allocationService: MaterialAllocationService,
    private readonly attachmentService: AttachmentService,
    private readonly sequenceService: SequenceService,
    private readonly notificationService: NotificationService,
    private readonly auditService: AuditService,
    private readonly clock: CampusClock,
  ) {}

  // ------------------------------------------------------------------ queries

  async getWorkOrder(id: string): Promise<WorkOrder> {
    const workOrder = await this.repository.findById(id);
    if (!workOrder) {
      throw new EntityNotFoundException('WorkOrder', id);
    }
    return workOrder;
  }

  async search(query: WorkOrderQueryDto, user: AuthenticatedUser): Promise<PageDto<WorkOrderResponseDto>> {
    const now = this.clock.now();
    const conditions: Prisma.WorkOrderWhereInput[] = [];
    if (!isManagement(user.role)) conditions.push({ technicianId: user.id });
    if (query.search) conditions.push({ OR: [{ code: { contains: query.search, mode: 'insensitive' } }, { title: { contains: query.search, mode: 'insensitive' } }] });
    if (query.status) conditions.push({ status: query.status });
    if (query.type) conditions.push({ type: query.type });
    if (query.priority) conditions.push({ priority: query.priority });
    if (query.technicianId) conditions.push({ technicianId: query.technicianId });
    if (query.assetId) conditions.push({ assetId: query.assetId });
    if (query.activeOnly || query.overdueOnly) conditions.push({ status: { in: [...ACTIVE_WORK_ORDER_STATUSES] } });
    if (query.overdueOnly) conditions.push({ dueAt: { lt: now } });
    if (query.blockedOnly) conditions.push({ materials: { some: { status: 'SHORTAGE' } }, status: { not: WorkOrderStatus.CANCELLED } });

    const orderBy = resolveSort(query.sortBy, query.sortBy ? query.sortDir : 'desc', SORTABLE_FIELDS, 'createdAt');
    const [rows, total] = await this.repository.findPage({ AND: conditions }, orderBy, query.skip, query.take);
    return PageDto.of(rows.map((row) => WorkOrderMapper.toResponse(row, now)), total, query.page, query.size);
  }

  async findOne(id: string, user: AuthenticatedUser): Promise<WorkOrderDetailDto> {
    const workOrder = await this.getDetail(id);
    this.assertCanAccess(workOrder, user);
    const materials = await this.allocationService.listForWorkOrder(id);
    return WorkOrderMapper.toDetail(workOrder, this.clock.now(), materials, availableWorkOrderActions(workOrder, user));
  }

  // ----------------------------------------------------------------- commands

  @Transactional()
  async create(dto: CreateWorkOrderDto, actor: AuthenticatedUser): Promise<WorkOrderDetailDto> {
    const workOrder = dto.requestId ? await this.createFromRequest(dto.requestId, dto, actor) : await this.createForAsset(dto, actor);
    return this.findOne(workOrder.id, actor);
  }

  /** Used by the preventive-maintenance scheduler (actor may be null when run by the daily job). */
  async createPreventive(input: PreventiveWorkInput, actorId: string | null): Promise<WorkOrder> {
    const technician = input.technicianId ? await this.technicianService.getAssignableTechnician(input.technicianId).catch(() => null) : null;
    const workOrder = await this.repository.create({
      code: await this.sequenceService.next(SequenceName.WORK_ORDER),
      type: WorkOrderType.PREVENTIVE,
      title: input.title,
      description: input.description,
      priority: input.priority,
      assetId: input.assetId,
      scheduleId: input.scheduleId,
      technicianId: technician?.id ?? null,
      createdById: actorId,
      dueAt: input.dueAt,
    });
    await this.repository.createTasks(workOrder.id, buildTaskPlan({ type: WorkOrderType.PREVENTIVE, requiresMaterialApproval: false, hasRequester: false }));
    await this.afterCreate(workOrder, actorId, technician?.fullName ?? null);
    return workOrder;
  }

  @Transactional()
  async assign(id: string, technicianId: string, actor: AuthenticatedUser): Promise<WorkOrderDetailDto> {
    const workOrder = await this.getWorkOrder(id);
    this.assertActive(workOrder);
    const technician = await this.technicianService.getAssignableTechnician(technicianId);
    await this.repository.update(id, { technicianId });
    if (workOrder.requestId) {
      const request = await this.requestWorkflow.getRequest(workOrder.requestId);
      if (request.status === RequestStatus.SUBMITTED || request.status === RequestStatus.ACKNOWLEDGED) {
        await this.requestWorkflow.markAssigned(request.id, actor.id, technician.fullName);
      }
    }
    await this.notificationService.notifyUser(technicianId, {
      title: `New work order ${workOrder.code}`,
      message: `${workOrder.title} (${workOrder.priority}) has been assigned to you.`,
      link: `/work-orders/${id}`,
    });
    if (workOrder.technicianId && workOrder.technicianId !== technicianId) {
      await this.notificationService.notifyUser(workOrder.technicianId, {
        title: `${workOrder.code} reassigned`,
        message: `${workOrder.title} was reassigned to ${technician.fullName}.`,
        link: `/work-orders/${id}`,
      });
    }
    await this.auditService.record({ actorId: actor.id, action: AuditAction.WORK_ORDER_ASSIGNED, entityType: 'WorkOrder', entityId: id, details: { technician: technician.fullName } });
    return this.findOne(id, actor);
  }

  @Transactional()
  async cancel(id: string, reason: string, actor: AuthenticatedUser): Promise<WorkOrderDetailDto> {
    const workOrder = await this.getWorkOrder(id);
    WorkOrderStatusMachine.assertTransition(workOrder.status, WorkOrderStatus.CANCELLED);
    await this.repository.update(id, { status: WorkOrderStatus.CANCELLED });
    await this.allocationService.releaseAllForWorkOrder(id, actor.id);
    if (workOrder.requestId) {
      await this.requestWorkflow.markUnassigned(workOrder.requestId, actor.id, reason);
    }
    if (workOrder.assetId && workOrder.status === WorkOrderStatus.IN_PROGRESS) {
      await this.assetService.changeStatus(workOrder.assetId, AssetStatus.OPERATIONAL);
    }
    await this.notificationService.notifyUser(workOrder.technicianId, { title: `${workOrder.code} cancelled`, message: reason, link: `/work-orders/${id}` });
    await this.recordStatusChange(workOrder, WorkOrderStatus.CANCELLED, actor.id, reason);
    return this.findOne(id, actor);
  }

  /** A manager signs off a job that has no requester (preventive or asset job). */
  @Transactional()
  async verify(id: string, actor: AuthenticatedUser): Promise<WorkOrderDetailDto> {
    const workOrder = await this.getWorkOrder(id);
    if (workOrder.requestId) {
      throw new BusinessRuleViolationException('This work order is verified by the requester confirming the repair', 'REQUESTER_VERIFIES');
    }
    WorkOrderStatusMachine.assertTransition(workOrder.status, WorkOrderStatus.VERIFIED);
    await this.repository.update(id, { status: WorkOrderStatus.VERIFIED, verifiedAt: new Date() });
    await this.recordStatusChange(workOrder, WorkOrderStatus.VERIFIED, actor.id);
    return this.findOne(id, actor);
  }

  @Transactional()
  async addEvidence(id: string, files: IncomingFile[], actor: AuthenticatedUser): Promise<AttachmentDto[]> {
    const workOrder = await this.getDetail(id);
    this.assertCanAccess(workOrder, actor);
    if (workOrder.status === WorkOrderStatus.CANCELLED || workOrder.status === WorkOrderStatus.VERIFIED) {
      throw new BusinessRuleViolationException('Evidence cannot be added to a closed work order', 'WORK_ORDER_CLOSED');
    }
    const saved = await this.attachmentService.attach({ workOrderId: id }, files, actor.id);
    await this.auditService.record({ actorId: actor.id, action: AuditAction.ATTACHMENT_UPLOADED, entityType: 'WorkOrder', entityId: id, details: { files: saved.map((f) => f.fileName) } });
    return saved;
  }

  // ----------------------------------------------------------- shared helpers

  async getDetail(id: string): Promise<WorkOrderDetail> {
    const workOrder = await this.repository.findDetail(id);
    if (!workOrder) {
      throw new EntityNotFoundException('WorkOrder', id);
    }
    return workOrder;
  }

  assertCanAccess(workOrder: { technicianId: string | null }, user: AuthenticatedUser): void {
    if (!isManagement(user.role) && !(user.role === Role.TECHNICIAN && workOrder.technicianId === user.id)) {
      throw new AccessDeniedException('This work order is not assigned to you');
    }
  }

  assertActive(workOrder: WorkOrder): void {
    if (!WorkOrderStatusMachine.isActive(workOrder.status)) {
      throw new BusinessRuleViolationException(`Work order ${workOrder.code} is ${workOrder.status.toLowerCase()}`, 'WORK_ORDER_NOT_ACTIVE');
    }
  }

  async recordStatusChange(workOrder: WorkOrder, to: WorkOrderStatus, actorId: string | null, note?: string): Promise<void> {
    await this.auditService.record({
      actorId,
      action: AuditAction.WORK_ORDER_STATUS_CHANGED,
      entityType: 'WorkOrder',
      entityId: workOrder.id,
      details: { code: workOrder.code, from: workOrder.status, to, note },
    });
  }

  // ------------------------------------------------------------------ private

  private async createFromRequest(requestId: string, dto: CreateWorkOrderDto, actor: AuthenticatedUser): Promise<WorkOrder> {
    const request = await this.requestWorkflow.getRequest(requestId);
    if (request.status !== RequestStatus.SUBMITTED && request.status !== RequestStatus.ACKNOWLEDGED) {
      throw new BusinessRuleViolationException(`Request ${request.code} is ${request.status.toLowerCase()} and cannot receive a new work order`, 'REQUEST_NOT_DISPATCHABLE');
    }
    if ((await this.repository.findByRequest(requestId)).some((wo) => WorkOrderStatusMachine.isActive(wo.status))) {
      throw new BusinessRuleViolationException(`Request ${request.code} already has an active work order`, 'ACTIVE_WORK_ORDER_EXISTS');
    }
    const technician = dto.technicianId ? await this.technicianService.getAssignableTechnician(dto.technicianId) : null;

    const workOrder = await this.repository.create({
      code: await this.sequenceService.next(SequenceName.WORK_ORDER),
      type: WorkOrderType.CORRECTIVE,
      title: dto.title ?? request.title,
      description: dto.description ?? request.description,
      priority: dto.priority ?? request.priority,
      requestId,
      assetId: request.assetId,
      technicianId: technician?.id ?? null,
      createdById: actor.id,
      dueAt: dto.dueAt ? new Date(dto.dueAt) : request.resolutionDueAt,
    });
    await this.repository.createTasks(
      workOrder.id,
      buildTaskPlan({ type: WorkOrderType.CORRECTIVE, requiresMaterialApproval: dto.requiresMaterialApproval ?? false, hasRequester: true }),
    );
    if (technician) {
      await this.requestWorkflow.markAssigned(requestId, actor.id, technician.fullName);
    } else if (request.status === RequestStatus.SUBMITTED) {
      await this.requestWorkflow.transition(request, RequestStatus.ACKNOWLEDGED, actor.id, `Work order ${workOrder.code} created`);
    }
    await this.afterCreate(workOrder, actor.id, technician?.fullName ?? null);
    return workOrder;
  }

  private async createForAsset(dto: CreateWorkOrderDto, actor: AuthenticatedUser): Promise<WorkOrder> {
    if (!dto.assetId || !dto.title || !dto.priority) {
      throw new BusinessRuleViolationException('assetId, title and priority are required when no request is given', 'WORK_ORDER_DETAILS_REQUIRED');
    }
    await this.assetService.getAsset(dto.assetId);
    const technician = dto.technicianId ? await this.technicianService.getAssignableTechnician(dto.technicianId) : null;
    const dueAt = dto.dueAt ? new Date(dto.dueAt) : (await this.slaService.calculateDueDates(dto.priority, this.clock.now())).resolutionDueAt;

    const workOrder = await this.repository.create({
      code: await this.sequenceService.next(SequenceName.WORK_ORDER),
      type: WorkOrderType.CORRECTIVE,
      title: dto.title,
      description: dto.description ?? null,
      priority: dto.priority,
      assetId: dto.assetId,
      technicianId: technician?.id ?? null,
      createdById: actor.id,
      dueAt,
    });
    await this.repository.createTasks(
      workOrder.id,
      buildTaskPlan({ type: WorkOrderType.CORRECTIVE, requiresMaterialApproval: dto.requiresMaterialApproval ?? false, hasRequester: false }),
    );
    await this.afterCreate(workOrder, actor.id, technician?.fullName ?? null);
    return workOrder;
  }

  private async afterCreate(workOrder: WorkOrder, actorId: string | null, technicianName: string | null): Promise<void> {
    if (workOrder.technicianId) {
      await this.notificationService.notifyUser(workOrder.technicianId, {
        title: `New work order ${workOrder.code}`,
        message: `${workOrder.title} (${workOrder.priority}) has been assigned to you.`,
        link: `/work-orders/${workOrder.id}`,
      });
    } else if (workOrder.type === WorkOrderType.PREVENTIVE) {
      await this.notificationService.notifyRoles([...RoleGroups.MANAGEMENT], {
        title: `Preventive work ${workOrder.code} needs a technician`,
        message: workOrder.title,
        link: `/work-orders/${workOrder.id}`,
      });
    }
    await this.auditService.record({
      actorId,
      action: AuditAction.WORK_ORDER_CREATED,
      entityType: 'WorkOrder',
      entityId: workOrder.id,
      details: { code: workOrder.code, type: workOrder.type, technician: technicianName, requestId: workOrder.requestId },
    });
  }
}
