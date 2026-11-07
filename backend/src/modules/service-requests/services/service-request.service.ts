import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, RequestStatus, Role } from '@prisma/client';
import { PageDto, resolveSort } from '../../../common/dto/page.dto';
import { AccessDeniedException, BusinessRuleViolationException, EntityNotFoundException } from '../../../common/exceptions/domain.exceptions';
import { isManagement, RoleGroups } from '../../../common/security/role-groups';
import { CampusClock } from '../../../common/time/campus-clock';
import { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { DateOnly } from '../../../common/utils/date-only';
import { SequenceName, SequenceService } from '../../../database/sequence.service';
import { Transactional } from '../../../database/transactional.decorator';
import { AssetService } from '../../assets/services/asset.service';
import { AuditAction } from '../../audit/domain/audit-action';
import { AuditService } from '../../audit/services/audit.service';
import { LocationService } from '../../locations/services/location.service';
import { NotificationService } from '../../notifications/services/notification.service';
import { calculatePriority } from '../../sla/domain/priority-matrix';
import { SlaService } from '../../sla/services/sla.service';
import { IncomingFile } from '../../storage/domain/file-storage';
import { AttachmentDto, AttachmentService } from '../../storage/services/attachment.service';
import { availableRequestActions } from '../domain/request-actions';
import { OPEN_REQUEST_STATUSES, RequestStatusMachine } from '../domain/request-status.machine';
import {
  ConfirmResolutionDto,
  CreateServiceRequestDto,
  RejectRequestDto,
  ReopenRequestDto,
  ServiceRequestDetailDto,
  ServiceRequestQueryDto,
  ServiceRequestResponseDto,
  StatusNoteDto,
} from '../dto/service-request.dto';
import { RequestClosedEvent, RequestConfirmedEvent, RequestEvents, RequestReopenedEvent } from '../events/request.events';
import { ServiceRequestMapper } from '../mappers/service-request.mapper';
import { RequestDetail, ServiceRequestRepository } from '../repositories/service-request.repository';
import { RequestWorkflowService } from './request-workflow.service';

const SORTABLE_FIELDS = ['createdAt', 'priority', 'resolutionDueAt', 'status', 'code'] as const;

/** Service request portal: submitting, tracking, reviewing and closing requests. */
@Injectable()
export class ServiceRequestService {
  constructor(
    private readonly repository: ServiceRequestRepository,
    private readonly workflow: RequestWorkflowService,
    private readonly locationService: LocationService,
    private readonly assetService: AssetService,
    private readonly slaService: SlaService,
    private readonly sequenceService: SequenceService,
    private readonly attachmentService: AttachmentService,
    private readonly notificationService: NotificationService,
    private readonly auditService: AuditService,
    private readonly events: EventEmitter2,
    private readonly clock: CampusClock,
  ) {}

  // ------------------------------------------------------------------ queries

  async search(query: ServiceRequestQueryDto, user: AuthenticatedUser): Promise<PageDto<ServiceRequestResponseDto>> {
    const now = this.clock.now();
    const conditions: Prisma.ServiceRequestWhereInput[] = [this.visibilityScope(user, query.mine)];
    if (query.search) {
      conditions.push({ OR: [{ code: { contains: query.search, mode: 'insensitive' } }, { title: { contains: query.search, mode: 'insensitive' } }] });
    }
    if (query.status) conditions.push({ status: query.status });
    if (query.category) conditions.push({ category: query.category });
    if (query.priority) conditions.push({ priority: query.priority });
    if (query.buildingId) conditions.push({ buildingId: query.buildingId });
    if (query.openOnly || query.overdueOnly) conditions.push({ status: { in: [...OPEN_REQUEST_STATUSES] } });
    if (query.overdueOnly) conditions.push({ resolutionDueAt: { lt: now } });
    if (query.escalatedOnly) conditions.push({ escalatedAt: { not: null } });
    if (query.createdFrom) conditions.push({ createdAt: { gte: DateOnly.parse(query.createdFrom) } });
    if (query.createdTo) conditions.push({ createdAt: { lt: DateOnly.addDays(DateOnly.parse(query.createdTo), 1) } });

    const orderBy = resolveSort(query.sortBy, query.sortBy ? query.sortDir : 'desc', SORTABLE_FIELDS, 'createdAt');
    const [rows, total] = await this.repository.findPage({ AND: conditions }, orderBy, query.skip, query.take);
    return PageDto.of(rows.map((row) => ServiceRequestMapper.toResponse(row, now)), total, query.page, query.size);
  }

  async findOne(id: string, user: AuthenticatedUser): Promise<ServiceRequestDetailDto> {
    const request = await this.getDetail(id);
    await this.assertCanView(request, user);
    const hasActiveWorkOrder = request.workOrders.some((wo) => wo.status !== 'CANCELLED');
    const actions = availableRequestActions({ status: request.status, requesterId: request.requesterId, hasActiveWorkOrder }, user);
    return ServiceRequestMapper.toDetail(request, this.clock.now(), actions);
  }

  // ------------------------------------------------------- requester commands

  @Transactional()
  async submit(dto: CreateServiceRequestDto, user: AuthenticatedUser): Promise<ServiceRequestDetailDto> {
    await this.locationService.assertLocation(dto.buildingId, dto.roomId);
    if (dto.assetId) {
      const asset = await this.assetService.getAsset(dto.assetId);
      if (asset.buildingId !== dto.buildingId) {
        throw new BusinessRuleViolationException('The selected asset is not in the selected building', 'ASSET_NOT_IN_BUILDING');
      }
    }
    const isSafetyRelated = dto.isSafetyRelated ?? dto.category === 'SAFETY';
    const priority = calculatePriority(dto.severity, dto.urgency, isSafetyRelated);
    const createdAt = this.clock.now();
    const dueDates = await this.slaService.calculateDueDates(priority, createdAt);

    const request = await this.repository.create({
      code: await this.sequenceService.next(SequenceName.SERVICE_REQUEST),
      title: dto.title,
      description: dto.description,
      category: dto.category,
      severity: dto.severity,
      urgency: dto.urgency,
      priority,
      isSafetyRelated,
      buildingId: dto.buildingId,
      roomId: dto.roomId ?? null,
      assetId: dto.assetId ?? null,
      locationDetails: dto.locationDetails ?? null,
      preferredContact: dto.preferredContact ?? 'IN_APP',
      contactDetail: dto.contactDetail ?? null,
      requesterId: user.id,
      createdAt,
      ...dueDates,
    });
    await this.repository.addHistory({ requestId: request.id, fromStatus: null, toStatus: RequestStatus.SUBMITTED, note: 'Request submitted', changedById: user.id });
    await this.notificationService.notifyRoles([...RoleGroups.MANAGEMENT], {
      title: `New ${priority} request ${request.code}`,
      message: `${dto.title}${isSafetyRelated ? ' (SAFETY RELATED)' : ''}`,
      link: `/requests/${request.id}`,
    });
    await this.auditService.record({
      actorId: user.id,
      action: AuditAction.REQUEST_SUBMITTED,
      entityType: 'ServiceRequest',
      entityId: request.id,
      details: { code: request.code, priority, category: dto.category },
    });
    return this.findOne(request.id, user);
  }

  @Transactional()
  async addAttachments(id: string, files: IncomingFile[], user: AuthenticatedUser): Promise<AttachmentDto[]> {
    const request = await this.getDetail(id);
    await this.assertCanView(request, user);
    if (!RequestStatusMachine.isOpen(request.status)) {
      throw new BusinessRuleViolationException('Files can only be added while the request is open', 'REQUEST_NOT_OPEN');
    }
    const saved = await this.attachmentService.attach({ requestId: id }, files, user.id);
    await this.auditService.record({ actorId: user.id, action: AuditAction.ATTACHMENT_UPLOADED, entityType: 'ServiceRequest', entityId: id, details: { files: saved.map((f) => f.fileName) } });
    return saved;
  }

  /** The requester confirms the repair and rates the service: RESOLVED -> VERIFIED. */
  @Transactional()
  async confirmResolution(id: string, dto: ConfirmResolutionDto, user: AuthenticatedUser): Promise<ServiceRequestDetailDto> {
    const request = await this.workflow.getRequest(id);
    this.assertRequester(request.requesterId, user);
    await this.workflow.transition(request, RequestStatus.VERIFIED, user.id, `Confirmed by requester (rating ${dto.rating}/5)`);
    await this.repository.createFeedback({ requestId: id, rating: dto.rating, comment: dto.comment ?? null, submittedBy: user.id });
    await this.auditService.record({ actorId: user.id, action: AuditAction.REQUEST_FEEDBACK_SUBMITTED, entityType: 'ServiceRequest', entityId: id, details: { rating: dto.rating } });
    await this.events.emitAsync(RequestEvents.CONFIRMED, new RequestConfirmedEvent(id, user.id));
    return this.findOne(id, user);
  }

  /** The requester says the problem is not fixed: RESOLVED -> IN_PROGRESS. */
  @Transactional()
  async reopen(id: string, dto: ReopenRequestDto, user: AuthenticatedUser): Promise<ServiceRequestDetailDto> {
    const request = await this.workflow.getRequest(id);
    this.assertRequester(request.requesterId, user);
    await this.workflow.transition(request, RequestStatus.IN_PROGRESS, user.id, `Re-opened by requester: ${dto.reason}`);
    await this.events.emitAsync(RequestEvents.REOPENED, new RequestReopenedEvent(id, user.id, dto.reason));
    await this.notificationService.notifyRoles([...RoleGroups.MANAGEMENT], {
      title: `${request.code} re-opened`,
      message: dto.reason,
      link: `/requests/${id}`,
    });
    return this.findOne(id, user);
  }

  // --------------------------------------------------------- manager commands

  @Transactional()
  async acknowledge(id: string, dto: StatusNoteDto, user: AuthenticatedUser): Promise<ServiceRequestDetailDto> {
    await this.workflow.transition(id, RequestStatus.ACKNOWLEDGED, user.id, dto.note ?? 'Request reviewed');
    return this.findOne(id, user);
  }

  @Transactional()
  async reject(id: string, dto: RejectRequestDto, user: AuthenticatedUser): Promise<ServiceRequestDetailDto> {
    await this.workflow.transition(id, RequestStatus.REJECTED, user.id, dto.reason, { rejectionReason: dto.reason });
    return this.findOne(id, user);
  }

  /** Closes a resolved request without the requester's confirmation (e.g. no answer for days). */
  @Transactional()
  async close(id: string, dto: StatusNoteDto, user: AuthenticatedUser): Promise<ServiceRequestDetailDto> {
    await this.workflow.transition(id, RequestStatus.CLOSED, user.id, dto.note ?? 'Closed by facility manager');
    await this.events.emitAsync(RequestEvents.CLOSED, new RequestClosedEvent(id, user.id));
    return this.findOne(id, user);
  }

  /** Daily job: flags overdue requests and alerts managers once per request. Returns the number escalated. */
  @Transactional()
  async escalateOverdue(): Promise<number> {
    const overdue = await this.repository.findNewlyOverdue(this.clock.now(), OPEN_REQUEST_STATUSES);
    for (const request of overdue) {
      await this.repository.update(request.id, { escalatedAt: this.clock.now() });
      await this.notificationService.notifyRoles([...RoleGroups.MANAGEMENT], {
        title: `ESCALATION: ${request.code} is overdue`,
        message: `${request.priority} request "${request.title}" missed its service-level target.`,
        link: `/requests/${request.id}`,
      });
      await this.auditService.record({ actorId: null, action: AuditAction.REQUEST_ESCALATED, entityType: 'ServiceRequest', entityId: request.id, details: { code: request.code } });
    }
    return overdue.length;
  }

  // ------------------------------------------------------------------ helpers

  private async getDetail(id: string): Promise<RequestDetail> {
    const request = await this.repository.findDetail(id);
    if (!request) {
      throw new EntityNotFoundException('ServiceRequest', id);
    }
    return request;
  }

  /** Who can see which requests: requesters their own, technicians their assignments, managers all. */
  private visibilityScope(user: AuthenticatedUser, mineOnly?: boolean): Prisma.ServiceRequestWhereInput {
    if (isManagement(user.role)) {
      return mineOnly ? { requesterId: user.id } : {};
    }
    if (user.role === Role.TECHNICIAN && !mineOnly) {
      return { OR: [{ requesterId: user.id }, { workOrders: { some: { technicianId: user.id } } }] };
    }
    return { requesterId: user.id };
  }

  private async assertCanView(request: { id: string; requesterId: string }, user: AuthenticatedUser): Promise<void> {
    if (isManagement(user.role) || request.requesterId === user.id) return;
    if (user.role === Role.TECHNICIAN && (await this.repository.isAssignedTechnician(request.id, user.id))) return;
    throw new AccessDeniedException('You can only view your own requests');
  }

  private assertRequester(requesterId: string, user: AuthenticatedUser): void {
    if (requesterId !== user.id) {
      throw new AccessDeniedException('Only the person who reported the issue can do this');
    }
  }
}

