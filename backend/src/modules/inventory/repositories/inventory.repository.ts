import { Injectable } from '@nestjs/common';
import { InventoryItem, MaterialStatus, Prisma, StockMovement } from '@prisma/client';
import { BaseRepository } from '../../../database/base.repository';
import { TransactionManager } from '../../../database/transaction-manager';

export const itemInclude = {
  materials: { where: { status: { in: [MaterialStatus.RESERVED, MaterialStatus.SHORTAGE] } }, select: { quantity: true, status: true } },
} satisfies Prisma.InventoryItemInclude;

export type ItemWithMaterials = Prisma.InventoryItemGetPayload<{ include: typeof itemInclude }>;

@Injectable()
export class InventoryRepository extends BaseRepository {
  constructor(transactionManager: TransactionManager) {
    super(transactionManager);
  }

  findById(id: string): Promise<ItemWithMaterials | null> {
    return this.db.inventoryItem.findUnique({ where: { id }, include: itemInclude });
  }

  findBySku(sku: string): Promise<InventoryItem | null> {
    return this.db.inventoryItem.findUnique({ where: { sku } });
  }

  /** Row-level lock (SELECT ... FOR UPDATE) so two reservations cannot oversell the same item. */
  async lockItem(id: string): Promise<void> {
    await this.db.$queryRaw`SELECT "id" FROM "inventory_items" WHERE "id" = ${id} FOR UPDATE`;
  }

  findAll(where: Prisma.InventoryItemWhereInput, orderBy: Prisma.InventoryItemOrderByWithRelationInput): Promise<ItemWithMaterials[]> {
    return this.db.inventoryItem.findMany({ where, include: itemInclude, orderBy });
  }

  async reservedQuantity(itemId: string): Promise<number> {
    const result = await this.db.materialRequirement.aggregate({ _sum: { quantity: true }, where: { itemId, status: MaterialStatus.RESERVED } });
    return result._sum.quantity ?? 0;
  }

  create(data: Prisma.InventoryItemCreateInput): Promise<InventoryItem> {
    return this.db.inventoryItem.create({ data });
  }

  update(id: string, data: Prisma.InventoryItemUpdateInput): Promise<InventoryItem> {
    return this.db.inventoryItem.update({ where: { id }, data });
  }

  changeQuantity(id: string, delta: number): Promise<InventoryItem> {
    return this.db.inventoryItem.update({ where: { id }, data: { quantityOnHand: { increment: delta } } });
  }

  addMovement(data: Prisma.StockMovementUncheckedCreateInput): Promise<StockMovement> {
    return this.db.stockMovement.create({ data });
  }

  findMovements(itemId: string, take: number) {
    return this.db.stockMovement.findMany({
      where: { itemId },
      include: { user: { select: { fullName: true } }, workOrder: { select: { id: true, code: true } } },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }
}
