import { Injectable } from '@nestjs/common';
import { MaterialStatus, MovementType, ProcurementStatus } from '@prisma/client';
import { EntityNotFoundException, InvalidStateTransitionException } from '../../../common/exceptions/domain.exceptions';
import { RoleGroups } from '../../../common/security/role-groups';
import { SequenceName, SequenceService } from '../../../database/sequence.service';
import { AuditAction } from '../../audit/domain/audit-action';
import { AuditService } from '../../audit/services/audit.service';
import { NotificationService } from '../../notifications/services/notification.service';
import { StockPolicy } from '../domain/stock-policy';
import { MaterialResponseDto } from '../dto/inventory.dto';
import { InventoryMapper } from '../mappers/inventory.mapper';
import { InventoryRepository } from '../repositories/inventory.repository';
import { MaterialRepository, MaterialWithRelations } from '../repositories/material.repository';
import { ProcurementRepository } from '../repositories/procurement.repository';

export interface WorkOrderRef {
  id: string;
  code: string;
}

/**
 * Spare parts needed by work orders: reserve, consume, release.
 * A requirement that cannot be covered becomes a SHORTAGE (blocking the work order)
 * and automatically raises a procurement request for manager approval.
 * Callers must run these methods inside a transaction.
 */
@Injectable()
export class MaterialAllocationService {
  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly materialRepository: MaterialRepository,
    private readonly procurementRepository: ProcurementRepository,
    private readonly sequenceService: SequenceService,
    private readonly notificationService: NotificationService,
    private readonly auditService: AuditService,
  ) {}

  async listForWorkOrder(workOrderId: string): Promise<MaterialResponseDto[]> {
    return (await this.materialRepository.findByWorkOrder(workOrderId)).map(InventoryMapper.toMaterialResponse);
  }

  async listShortages(): Promise<MaterialResponseDto[]> {
    return (await this.materialRepository.findShortages()).map(InventoryMapper.toMaterialResponse);
  }

  async hasShortage(workOrderId: string): Promise<boolean> {
    return (await this.materialRepository.countShortagesForWorkOrder(workOrderId)) > 0;
  }

  async getMaterial(id: string, workOrderId: string): Promise<MaterialWithRelations> {
    const material = await this.materialRepository.findById(id);
    if (!material || material.workOrderId !== workOrderId) {
      throw new EntityNotFoundException('MaterialRequirement', id);
    }
    return material;
  }

  async require(workOrder: WorkOrderRef, itemId: string, quantity: number, actorId: string): Promise<MaterialResponseDto> {
    await this.inventoryRepository.lockItem(itemId);
    const item = await this.inventoryRepository.findById(itemId);
    if (!item) {
      throw new EntityNotFoundException('InventoryItem', itemId);
    }
    const available = StockPolicy.available(item.quantityOnHand, await this.inventoryRepository.reservedQuantity(itemId));
    const status = StockPolicy.allocate(quantity, available);
    const material = await this.materialRepository.create({ workOrderId: workOrder.id, itemId, quantity, status });

    if (status === MaterialStatus.SHORTAGE) {
      const shortfall = quantity - available;
      await this.procurementRepository.create({
        code: await this.sequenceService.next(SequenceName.PROCUREMENT),
        itemId,
        quantity: StockPolicy.suggestedOrderQuantity(shortfall, item.reorderLevel),
        reason: `Shortage for ${workOrder.code}: ${quantity} ${item.unit} needed, ${available} available`,
        workOrderId: workOrder.id,
        requestedById: actorId,
        status: ProcurementStatus.PENDING_APPROVAL,
      });
      await this.notificationService.notifyRoles([...RoleGroups.MANAGEMENT], {
        title: `Shortage: ${item.name}`,
        message: `${workOrder.code} is blocked: ${quantity} ${item.unit} needed, only ${available} available. A procurement request awaits approval.`,
        link: '/inventory?tab=procurement',
      });
    }
    await this.auditService.record({
      actorId,
      action: AuditAction.MATERIAL_RESERVED,
      entityType: 'WorkOrder',
      entityId: workOrder.id,
      details: { item: item.sku, quantity, status },
    });
    return InventoryMapper.toMaterialResponse((await this.materialRepository.findById(material.id))!);
  }

  /** The technician used the reserved parts: they leave the store. */
  async consume(material: MaterialWithRelations, actorId: string): Promise<void> {
    if (material.status !== MaterialStatus.RESERVED) {
      throw new InvalidStateTransitionException('MaterialRequirement', material.status, MaterialStatus.CONSUMED);
    }
    await this.inventoryRepository.lockItem(material.itemId);
    await this.materialRepository.updateStatus(material.id, MaterialStatus.CONSUMED);
    await this.inventoryRepository.changeQuantity(material.itemId, -material.quantity);
    await this.inventoryRepository.addMovement({
      itemId: material.itemId,
      type: MovementType.OUT,
      quantity: -material.quantity,
      note: `Used for ${material.workOrder.code}`,
      workOrderId: material.workOrderId,
      performedBy: actorId,
    });
    await this.auditService.record({ actorId, action: AuditAction.MATERIAL_CONSUMED, entityType: 'WorkOrder', entityId: material.workOrderId, details: { item: material.item.sku, quantity: material.quantity } });
  }

  /** Cancels a reservation / shortage. Released stock is offered to other waiting work orders. */
  async release(material: MaterialWithRelations, actorId: string): Promise<void> {
    if (material.status !== MaterialStatus.RESERVED && material.status !== MaterialStatus.SHORTAGE) {
      throw new InvalidStateTransitionException('MaterialRequirement', material.status, MaterialStatus.RELEASED);
    }
    await this.materialRepository.updateStatus(material.id, MaterialStatus.RELEASED);
    await this.auditService.record({ actorId, action: AuditAction.MATERIAL_RELEASED, entityType: 'WorkOrder', entityId: material.workOrderId, details: { item: material.item.sku, quantity: material.quantity } });
    if (material.status === MaterialStatus.RESERVED) {
      await this.allocateWaitingShortages(material.itemId, actorId);
    }
  }

  async releaseAllForWorkOrder(workOrderId: string, actorId: string): Promise<void> {
    for (const material of await this.materialRepository.findByWorkOrder(workOrderId)) {
      if (material.status === MaterialStatus.RESERVED || material.status === MaterialStatus.SHORTAGE) {
        await this.release(material, actorId);
      }
    }
  }

  /** First-come-first-served: turns waiting shortages into reservations while stock allows. */
  async allocateWaitingShortages(itemId: string, actorId: string): Promise<number> {
    await this.inventoryRepository.lockItem(itemId);
    const item = await this.inventoryRepository.findById(itemId);
    if (!item) return 0;
    let available = StockPolicy.available(item.quantityOnHand, await this.inventoryRepository.reservedQuantity(itemId));
    let allocated = 0;

    for (const shortage of await this.materialRepository.findShortages(itemId)) {
      if (shortage.quantity > available) continue;
      await this.materialRepository.updateStatus(shortage.id, MaterialStatus.RESERVED);
      available -= shortage.quantity;
      allocated++;
      await this.notificationService.notifyUser(shortage.workOrder.technicianId, {
        title: `Parts available for ${shortage.workOrder.code}`,
        message: `${shortage.quantity} ${shortage.item.unit} of ${shortage.item.name} are now reserved for you.`,
        link: `/work-orders/${shortage.workOrderId}`,
      });
      await this.auditService.record({ actorId, action: AuditAction.MATERIAL_RESERVED, entityType: 'WorkOrder', entityId: shortage.workOrderId, details: { item: shortage.item.sku, quantity: shortage.quantity, fromShortage: true } });
    }
    return allocated;
  }
}
