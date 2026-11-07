import { Injectable } from '@nestjs/common';
import { MovementType, ProcurementStatus } from '@prisma/client';
import { PageDto } from '../../../common/dto/page.dto';
import { EntityNotFoundException, InvalidStateTransitionException } from '../../../common/exceptions/domain.exceptions';
import { RoleGroups } from '../../../common/security/role-groups';
import { SequenceName, SequenceService } from '../../../database/sequence.service';
import { Transactional } from '../../../database/transactional.decorator';
import { AuditAction } from '../../audit/domain/audit-action';
import { AuditService } from '../../audit/services/audit.service';
import { NotificationService } from '../../notifications/services/notification.service';
import { CreateProcurementDto, ProcurementDecisionDto, ProcurementQueryDto, ProcurementResponseDto } from '../dto/inventory.dto';
import { InventoryMapper } from '../mappers/inventory.mapper';
import { ProcurementRepository, ProcurementWithRelations } from '../repositories/procurement.repository';
import { InventoryService } from './inventory.service';
import { MaterialAllocationService } from './material-allocation.service';

/**
 * Purchase requests for spare parts:
 * PENDING_APPROVAL -> APPROVED -> RECEIVED (stock added), or PENDING_APPROVAL -> REJECTED.
 */
@Injectable()
export class ProcurementService {
  constructor(
    private readonly repository: ProcurementRepository,
    private readonly inventoryService: InventoryService,
    private readonly allocationService: MaterialAllocationService,
    private readonly sequenceService: SequenceService,
    private readonly notificationService: NotificationService,
    private readonly auditService: AuditService,
  ) {}

  async search(query: ProcurementQueryDto): Promise<PageDto<ProcurementResponseDto>> {
    const [rows, total] = await this.repository.findPage({ status: query.status, itemId: query.itemId }, query.skip, query.take);
    return PageDto.of(rows.map(InventoryMapper.toProcurementResponse), total, query.page, query.size);
  }

  @Transactional()
  async create(dto: CreateProcurementDto, actorId: string): Promise<ProcurementResponseDto> {
    await this.inventoryService.getItem(dto.itemId);
    const procurement = await this.repository.create({
      code: await this.sequenceService.next(SequenceName.PROCUREMENT),
      itemId: dto.itemId,
      quantity: dto.quantity,
      reason: dto.reason,
      workOrderId: dto.workOrderId ?? null,
      requestedById: actorId,
    });
    await this.notificationService.notifyRoles([...RoleGroups.MANAGEMENT], {
      title: `Procurement ${procurement.code} needs approval`,
      message: dto.reason,
      link: '/inventory?tab=procurement',
    });
    await this.auditService.record({ actorId, action: AuditAction.PROCUREMENT_REQUESTED, entityType: 'ProcurementRequest', entityId: procurement.id, details: { ...dto } });
    return InventoryMapper.toProcurementResponse(await this.getProcurement(procurement.id));
  }

  @Transactional()
  async approve(id: string, dto: ProcurementDecisionDto, actorId: string): Promise<ProcurementResponseDto> {
    return this.decide(id, ProcurementStatus.APPROVED, dto, actorId, AuditAction.PROCUREMENT_APPROVED);
  }

  @Transactional()
  async reject(id: string, dto: ProcurementDecisionDto, actorId: string): Promise<ProcurementResponseDto> {
    return this.decide(id, ProcurementStatus.REJECTED, dto, actorId, AuditAction.PROCUREMENT_REJECTED);
  }

  /** The ordered parts arrived: add them to stock and unblock waiting work orders. */
  @Transactional()
  async receive(id: string, actorId: string): Promise<ProcurementResponseDto> {
    const procurement = await this.getProcurement(id);
    if (procurement.status !== ProcurementStatus.APPROVED) {
      throw new InvalidStateTransitionException('ProcurementRequest', procurement.status, ProcurementStatus.RECEIVED);
    }
    await this.repository.update(id, { status: ProcurementStatus.RECEIVED, receivedAt: new Date() });
    const item = await this.inventoryService.getItem(procurement.itemId);
    await this.inventoryService.applyMovement(item, MovementType.IN, procurement.quantity, `Received ${procurement.code}`, actorId);
    const unblocked = await this.allocationService.allocateWaitingShortages(procurement.itemId, actorId);
    await this.auditService.record({ actorId, action: AuditAction.PROCUREMENT_RECEIVED, entityType: 'ProcurementRequest', entityId: id, details: { quantity: procurement.quantity, unblockedRequirements: unblocked } });
    return InventoryMapper.toProcurementResponse(await this.getProcurement(id));
  }

  private async decide(id: string, to: ProcurementStatus, dto: ProcurementDecisionDto, actorId: string, action: AuditAction): Promise<ProcurementResponseDto> {
    const procurement = await this.getProcurement(id);
    if (procurement.status !== ProcurementStatus.PENDING_APPROVAL) {
      throw new InvalidStateTransitionException('ProcurementRequest', procurement.status, to);
    }
    await this.repository.update(id, { status: to, decidedById: actorId, decidedAt: new Date(), decisionNote: dto.note ?? null });
    await this.notificationService.notifyUser(procurement.requestedById === actorId ? null : procurement.requestedById, {
      title: `Procurement ${procurement.code} ${to.toLowerCase()}`,
      message: `${procurement.quantity} ${procurement.item.unit} of ${procurement.item.name}${dto.note ? ` - ${dto.note}` : ''}`,
      link: '/inventory?tab=procurement',
    });
    await this.auditService.record({ actorId, action, entityType: 'ProcurementRequest', entityId: id, details: { note: dto.note } });
    return InventoryMapper.toProcurementResponse(await this.getProcurement(id));
  }

  private async getProcurement(id: string): Promise<ProcurementWithRelations> {
    const procurement = await this.repository.findById(id);
    if (!procurement) {
      throw new EntityNotFoundException('ProcurementRequest', id);
    }
    return procurement;
  }
}
