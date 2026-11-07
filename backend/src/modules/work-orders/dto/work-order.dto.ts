import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { Priority, TaskStatus, TaskType, WorkOrderStatus, WorkOrderType } from '@prisma/client';
import { PageQueryDto } from '../../../common/dto/page-query.dto';
import { BuildingSummaryDto, RoomSummaryDto } from '../../locations/dto/location.dto';
import { MaterialResponseDto } from '../../inventory/dto/inventory.dto';
import { AttachmentDto } from '../../storage/services/attachment.service';
import { UserSummaryDto } from '../../users/dto/user.dto';
import { WorkOrderAction } from '../domain/work-order-actions';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const toBoolean = ({ value }: { value: unknown }) => (value === undefined ? undefined : value === true || value === 'true');

export class WorkOrderQueryDto extends PageQueryDto {
  /** Code or title. */
  @IsOptional() @Transform(trim) @IsString() search?: string;
  @IsOptional() @IsEnum(WorkOrderStatus) status?: WorkOrderStatus;
  @IsOptional() @IsEnum(WorkOrderType) type?: WorkOrderType;
  @IsOptional() @IsEnum(Priority) priority?: Priority;
  @IsOptional() @IsUUID() technicianId?: string;
  @IsOptional() @IsUUID() assetId?: string;
  @IsOptional() @Transform(toBoolean) @IsBoolean() activeOnly?: boolean;
  /** Only work orders waiting for spare parts. */
  @IsOptional() @Transform(toBoolean) @IsBoolean() blockedOnly?: boolean;
  @IsOptional() @Transform(toBoolean) @IsBoolean() overdueOnly?: boolean;
}

/**
 * Creates a work order. Two flavours:
 *  - from a service request (requestId given): title, priority, location and due date come from the request;
 *  - standalone corrective job on an asset (no requestId): assetId, title and priority are required.
 */
export class CreateWorkOrderDto {
  @IsOptional() @IsUUID() requestId?: string;
  @IsOptional() @IsUUID() assetId?: string;
  @IsOptional() @Transform(trim) @IsString() @MinLength(5) @MaxLength(120) title?: string;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(2000) description?: string;
  @IsOptional() @IsEnum(Priority) priority?: Priority;
  @IsOptional() @IsUUID() technicianId?: string;
  /** Adds a "material approval" step between inspection and repair. */
  @IsOptional() @IsBoolean() requiresMaterialApproval?: boolean;
  /** Overrides the due date (ISO date-time). */
  @IsOptional() @IsDateString() dueAt?: string;
}

export class AssignTechnicianDto {
  @IsUUID() technicianId: string;
}

export class TaskNotesDto {
  @IsOptional() @Transform(trim) @IsString() @MaxLength(2000) notes?: string;
}

export class ReasonDto {
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(500) reason: string;
}

export class WorkOrderResponseDto {
  id: string;
  code: string;
  type: WorkOrderType;
  title: string;
  priority: Priority;
  status: WorkOrderStatus;
  technician: { id: string; fullName: string } | null;
  asset: { id: string; code: string; name: string } | null;
  request: { id: string; code: string; title: string; status: string } | null;
  building: BuildingSummaryDto | null;
  room: RoomSummaryDto | null;
  dueAt: string;
  isOverdue: boolean;
  isBlocked: boolean;
  createdAt: string;
  completedAt: string | null;
}

export class WorkOrderTaskDto {
  id: string;
  sequence: number;
  type: TaskType;
  title: string;
  status: TaskStatus;
  notes: string | null;
  dependsOn: number[];
  completedAt: string | null;
  completedBy: string | null;
  /** True when every prerequisite is DONE/SKIPPED. */
  isUnlocked: boolean;
}

export class WorkOrderDetailDto extends WorkOrderResponseDto {
  description: string | null;
  repairNotes: string | null;
  requester: UserSummaryDto | null;
  createdBy: string | null;
  schedule: { id: string; title: string } | null;
  startedAt: string | null;
  verifiedAt: string | null;
  tasks: WorkOrderTaskDto[];
  materials: MaterialResponseDto[];
  attachments: AttachmentDto[];
  availableActions: WorkOrderAction[];
}
