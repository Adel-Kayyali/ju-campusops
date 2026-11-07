import { Injectable } from '@nestjs/common';
import { InventoryItem, MovementType, Prisma } from '@prisma/client';
import { BusinessRuleViolationException, EntityNotFoundException, ResourceConflictException } from '../../../common/exceptions/domain.exceptions';
import { Transactional } from '../../../database/transactional.decorator';
import { AuditAction } from '../../audit/domain/audit-action';
import { AuditService } from '../../audit/services/audit.service';
import {
  AdjustStockDto,
  CreateInventoryItemDto,
  InventoryItemDetailDto,
  InventoryItemResponseDto,
  InventoryQueryDto,
  UpdateInventoryItemDto,
} from '../dto/inventory.dto';
import { InventoryMapper } from '../mappers/inventory.mapper';
import { InventoryRepository, ItemWithMaterials } from '../repositories/inventory.repository';
import { MaterialRepository } from '../repositories/material.repository';
import { MaterialAllocationService } from './material-allocation.service';

/** Spare-part catalogue and stock levels. */
@Injectable()
export class InventoryService {
  constructor(
    private readonly repository: InventoryRepository,
    private readonly materialRepository: MaterialRepository,
    private readonly allocationService: MaterialAllocationService,
    private readonly auditService: AuditService,
  ) {}

  async getItem(id: string): Promise<ItemWithMaterials> {
    const item = await this.repository.findById(id);
    if (!item) {
      throw new EntityNotFoundException('InventoryItem', id);
    }
    return item;
  }

  async search(query: InventoryQueryDto): Promise<InventoryItemResponseDto[]> {
    const where: Prisma.InventoryItemWhereInput = {
      category: query.category ? { equals: query.category, mode: 'insensitive' } : undefined,
      OR: query.search
        ? [{ sku: { contains: query.search, mode: 'insensitive' } }, { name: { contains: query.search, mode: 'insensitive' } }]
        : undefined,
    };
    const items = (await this.repository.findAll(where, { name: 'asc' })).map(InventoryMapper.toItemResponse);
    return query.lowStockOnly ? items.filter((item) => item.isLowStock || item.shortageQuantity > 0) : items;
  }

  async findOne(id: string): Promise<InventoryItemDetailDto> {
    const item = await this.getItem(id);
    const [movements, waiting] = await Promise.all([this.repository.findMovements(id, 30), this.materialRepository.findShortages(id)]);
    return {
      item: InventoryMapper.toItemResponse(item),
      movements: movements.map((movement) => ({
        id: movement.id,
        type: movement.type,
        quantity: movement.quantity,
        note: movement.note,
        workOrder: movement.workOrder,
        performedBy: movement.user.fullName,
        createdAt: movement.createdAt.toISOString(),
      })),
      waitingWorkOrders: waiting.map(InventoryMapper.toMaterialResponse),
    };
  }

  @Transactional()
  async create(dto: CreateInventoryItemDto, actorId: string): Promise<InventoryItemResponseDto> {
    const sku = dto.sku.toUpperCase();
    if (await this.repository.findBySku(sku)) {
      throw new ResourceConflictException(`An item with SKU ${sku} already exists`, 'SKU_TAKEN');
    }
    const item = await this.repository.create({ ...dto, sku });
    if ((dto.quantityOnHand ?? 0) > 0) {
      await this.repository.addMovement({ itemId: item.id, type: MovementType.IN, quantity: item.quantityOnHand, note: 'Initial stock', performedBy: actorId });
    }
    await this.auditService.record({ actorId, action: AuditAction.ITEM_CREATED, entityType: 'InventoryItem', entityId: item.id, details: { sku } });
    return InventoryMapper.toItemResponse(await this.getItem(item.id));
  }

  @Transactional()
  async update(id: string, dto: UpdateInventoryItemDto, actorId: string): Promise<InventoryItemResponseDto> {
    await this.getItem(id);
    await this.repository.update(id, dto);
    await this.auditService.record({ actorId, action: AuditAction.ITEM_UPDATED, entityType: 'InventoryItem', entityId: id, details: { ...dto } });
    return InventoryMapper.toItemResponse(await this.getItem(id));
  }

  /** Goods received or stock-count correction. New stock is offered to waiting work orders first. */
  @Transactional()
  async adjustStock(id: string, dto: AdjustStockDto, actorId: string): Promise<InventoryItemResponseDto> {
    await this.repository.lockItem(id);
    const item = await this.getItem(id);
    if (dto.type === MovementType.IN && dto.quantity < 0) {
      throw new BusinessRuleViolationException('Received quantity must be positive', 'INVALID_QUANTITY');
    }
    await this.applyMovement(item, dto.type, dto.quantity, dto.note, actorId);
    await this.auditService.record({ actorId, action: AuditAction.STOCK_ADJUSTED, entityType: 'InventoryItem', entityId: id, details: { ...dto } });
    if (dto.quantity > 0) {
      await this.allocationService.allocateWaitingShortages(id, actorId);
    }
    return InventoryMapper.toItemResponse(await this.getItem(id));
  }

  /** Adds a stock movement and updates the quantity on hand (never below the reserved quantity). */
  async applyMovement(item: InventoryItem, type: MovementType, signedQuantity: number, note: string, actorId: string, workOrderId?: string): Promise<void> {
    const reserved = await this.repository.reservedQuantity(item.id);
    const newOnHand = item.quantityOnHand + signedQuantity;
    if (newOnHand < 0 || (type === MovementType.ADJUSTMENT && newOnHand < reserved)) {
      throw new BusinessRuleViolationException(
        `Stock of ${item.name} cannot go below ${type === MovementType.ADJUSTMENT ? `the reserved quantity (${reserved})` : 'zero'}`,
        'INSUFFICIENT_STOCK',
      );
    }
    await this.repository.changeQuantity(item.id, signedQuantity);
    await this.repository.addMovement({ itemId: item.id, type, quantity: signedQuantity, note, workOrderId: workOrderId ?? null, performedBy: actorId });
  }
}
