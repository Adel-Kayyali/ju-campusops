import type { PageParams } from '@/api/types';
import type { MaterialStatus, MovementType, ProcurementStatus } from '@/shared/types/enums';

export interface ItemRef {
  id: string;
  sku: string;
  name: string;
  unit: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  quantityOnHand: number;
  reservedQuantity: number;
  availableQuantity: number;
  shortageQuantity: number;
  reorderLevel: number;
  isLowStock: boolean;
  unitCost: number;
  storageLocation: string | null;
}

export interface StockMovement {
  id: string;
  type: MovementType;
  quantity: number;
  note: string | null;
  workOrder: { id: string; code: string } | null;
  performedBy: string;
  createdAt: string;
}

export interface Material {
  id: string;
  item: ItemRef;
  quantity: number;
  status: MaterialStatus;
  workOrder: { id: string; code: string; title: string };
  createdAt: string;
}

export interface InventoryItemDetail {
  item: InventoryItem;
  movements: StockMovement[];
  waitingWorkOrders: Material[];
}

export interface InventoryQuery {
  search?: string;
  category?: string;
  lowStockOnly?: boolean;
}

export interface InventoryItemInput {
  sku: string;
  name: string;
  category: string;
  unit?: string;
  quantityOnHand?: number;
  reorderLevel?: number;
  unitCost?: number;
  storageLocation?: string;
}

export interface AdjustStockInput {
  type: Extract<MovementType, 'IN' | 'ADJUSTMENT'>;
  quantity: number;
  note: string;
}

export interface Procurement {
  id: string;
  code: string;
  item: ItemRef;
  quantity: number;
  reason: string;
  status: ProcurementStatus;
  workOrder: { id: string; code: string } | null;
  requestedBy: string;
  decidedBy: string | null;
  decisionNote: string | null;
  decidedAt: string | null;
  receivedAt: string | null;
  createdAt: string;
}

export interface ProcurementQuery extends PageParams {
  status?: ProcurementStatus;
  itemId?: string;
}

export interface ProcurementInput {
  itemId: string;
  quantity: number;
  reason: string;
  workOrderId?: string;
}
