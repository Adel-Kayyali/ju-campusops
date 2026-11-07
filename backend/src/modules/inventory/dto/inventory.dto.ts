import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min, NotEquals } from 'class-validator';
import { MaterialStatus, MovementType, ProcurementStatus } from '@prisma/client';
import { PageQueryDto } from '../../../common/dto/page-query.dto';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const toBoolean = ({ value }: { value: unknown }) => (value === undefined ? undefined : value === true || value === 'true');

// ------------------------------------------------------------------ items

export class InventoryQueryDto {
  /** SKU or name. */
  @IsOptional() @Transform(trim) @IsString() search?: string;
  @IsOptional() @Transform(trim) @IsString() category?: string;
  @IsOptional() @Transform(toBoolean) @IsBoolean() lowStockOnly?: boolean;
}

export class CreateInventoryItemDto {
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(30) sku: string;
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(120) name: string;
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(60) category: string;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(20) unit?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100000) quantityOnHand?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(10000) reorderLevel?: number;
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) unitCost?: number;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(80) storageLocation?: string;
}

export class UpdateInventoryItemDto {
  @IsOptional() @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(120) name?: string;
  @IsOptional() @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(60) category?: string;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(20) unit?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(10000) reorderLevel?: number;
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) unitCost?: number;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(80) storageLocation?: string;
}

export class AdjustStockDto {
  /** IN = goods received (positive quantity); ADJUSTMENT = stock-count correction (+/-). */
  @IsIn([MovementType.IN, MovementType.ADJUSTMENT]) type: MovementType;
  @Type(() => Number) @IsInt() @NotEquals(0) @Min(-10000) @Max(10000) quantity: number;
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(300) note: string;
}

export class InventoryItemResponseDto {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  quantityOnHand: number;
  reservedQuantity: number;
  availableQuantity: number;
  /** Units missing for work orders waiting on this item. */
  shortageQuantity: number;
  reorderLevel: number;
  isLowStock: boolean;
  unitCost: number;
  storageLocation: string | null;
}

export class StockMovementDto {
  id: string;
  type: MovementType;
  quantity: number;
  note: string | null;
  workOrder: { id: string; code: string } | null;
  performedBy: string;
  createdAt: string;
}

export class InventoryItemDetailDto {
  item: InventoryItemResponseDto;
  movements: StockMovementDto[];
  waitingWorkOrders: MaterialResponseDto[];
}

// -------------------------------------------------------------- materials

export class AddMaterialDto {
  @IsUUID() itemId: string;
  @Type(() => Number) @IsInt() @Min(1) @Max(1000) quantity: number;
}

export class MaterialResponseDto {
  id: string;
  item: { id: string; sku: string; name: string; unit: string };
  quantity: number;
  status: MaterialStatus;
  workOrder: { id: string; code: string; title: string };
  createdAt: string;
}

// ------------------------------------------------------------ procurement

export class ProcurementQueryDto extends PageQueryDto {
  @IsOptional() @IsEnum(ProcurementStatus) status?: ProcurementStatus;
  @IsOptional() @IsUUID() itemId?: string;
}

export class CreateProcurementDto {
  @IsUUID() itemId: string;
  @Type(() => Number) @IsInt() @Min(1) @Max(10000) quantity: number;
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(300) reason: string;
  @IsOptional() @IsUUID() workOrderId?: string;
}

export class ProcurementDecisionDto {
  @IsOptional() @Transform(trim) @IsString() @MaxLength(300) note?: string;
}

export class ProcurementResponseDto {
  id: string;
  code: string;
  item: { id: string; sku: string; name: string; unit: string };
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
