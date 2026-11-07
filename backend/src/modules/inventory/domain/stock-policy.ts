import { MaterialStatus } from '@prisma/client';

/**
 * Stock rules.
 *  - quantityOnHand counts every unit physically in the store, including reserved ones.
 *  - available = onHand - reserved (what can still be promised to a new work order).
 *  - A requirement is RESERVED when enough units are available, otherwise it is a SHORTAGE
 *    that blocks the work order until stock is received.
 */
export class StockPolicy {
  static available(quantityOnHand: number, reservedQuantity: number): number {
    return Math.max(0, quantityOnHand - reservedQuantity);
  }

  static isLowStock(available: number, reorderLevel: number): boolean {
    return available <= reorderLevel;
  }

  static allocate(requested: number, available: number): MaterialStatus {
    return requested <= available ? MaterialStatus.RESERVED : MaterialStatus.SHORTAGE;
  }

  /** Quantity to order so the shortage is covered and the item is back above its reorder level. */
  static suggestedOrderQuantity(shortfall: number, reorderLevel: number): number {
    return Math.max(shortfall, shortfall + reorderLevel);
  }
}
