import { MaterialStatus } from '@prisma/client';
import { toMoney } from '../../../common/utils/money';
import { StockPolicy } from '../domain/stock-policy';
import { InventoryItemResponseDto, MaterialResponseDto, ProcurementResponseDto } from '../dto/inventory.dto';
import { ItemWithMaterials } from '../repositories/inventory.repository';
import { MaterialWithRelations } from '../repositories/material.repository';
import { ProcurementWithRelations } from '../repositories/procurement.repository';

export class InventoryMapper {
  static toItemResponse(item: ItemWithMaterials): InventoryItemResponseDto {
    const sum = (status: MaterialStatus) => item.materials.filter((m) => m.status === status).reduce((total, m) => total + m.quantity, 0);
    const reserved = sum(MaterialStatus.RESERVED);
    const available = StockPolicy.available(item.quantityOnHand, reserved);
    return {
      id: item.id,
      sku: item.sku,
      name: item.name,
      category: item.category,
      unit: item.unit,
      quantityOnHand: item.quantityOnHand,
      reservedQuantity: reserved,
      availableQuantity: available,
      shortageQuantity: sum(MaterialStatus.SHORTAGE),
      reorderLevel: item.reorderLevel,
      isLowStock: StockPolicy.isLowStock(available, item.reorderLevel),
      unitCost: toMoney(item.unitCost),
      storageLocation: item.storageLocation,
    };
  }

  static toMaterialResponse(material: MaterialWithRelations): MaterialResponseDto {
    return {
      id: material.id,
      item: material.item,
      quantity: material.quantity,
      status: material.status,
      workOrder: { id: material.workOrder.id, code: material.workOrder.code, title: material.workOrder.title },
      createdAt: material.createdAt.toISOString(),
    };
  }

  static toProcurementResponse(procurement: ProcurementWithRelations): ProcurementResponseDto {
    return {
      id: procurement.id,
      code: procurement.code,
      item: procurement.item,
      quantity: procurement.quantity,
      reason: procurement.reason,
      status: procurement.status,
      workOrder: procurement.workOrder,
      requestedBy: procurement.requestedBy.fullName,
      decidedBy: procurement.decidedBy?.fullName ?? null,
      decisionNote: procurement.decisionNote,
      decidedAt: procurement.decidedAt?.toISOString() ?? null,
      receivedAt: procurement.receivedAt?.toISOString() ?? null,
      createdAt: procurement.createdAt.toISOString(),
    };
  }
}
