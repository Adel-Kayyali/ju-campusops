import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';
import { ContactMethod, Priority, RequestCategory, RequestStatus, Severity, Urgency } from '@prisma/client';
import { PageQueryDto } from '../../../common/dto/page-query.dto';
import { BuildingSummaryDto, RoomSummaryDto } from '../../locations/dto/location.dto';
import { AttachmentDto } from '../../storage/services/attachment.service';
import { UserSummaryDto } from '../../users/dto/user.dto';
import { SlaState } from '../../sla/domain/sla-evaluator';
import { RequestAction } from '../domain/request-actions';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const toBoolean = ({ value }: { value: unknown }) => (value === undefined ? undefined : value === true || value === 'true');

export class CreateServiceRequestDto {
  @Transform(trim) @IsString() @MinLength(5) @MaxLength(120) title: string;
  @Transform(trim) @IsString() @MinLength(10) @MaxLength(2000) description: string;
  @IsEnum(RequestCategory) category: RequestCategory;
  @IsEnum(Severity) severity: Severity;
  @IsEnum(Urgency) urgency: Urgency;
  @IsOptional() @IsBoolean() isSafetyRelated?: boolean;
  @IsUUID() buildingId: string;
  @IsOptional() @IsUUID() roomId?: string;
  @IsOptional() @IsUUID() assetId?: string;
  /** Free text such as "near the north stairs". */
  @IsOptional() @Transform(trim) @IsString() @MaxLength(200) locationDetails?: string;
  @IsOptional() @IsEnum(ContactMethod) preferredContact?: ContactMethod;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(120) contactDetail?: string;
}

export class ServiceRequestQueryDto extends PageQueryDto {
  /** Code or title. */
  @IsOptional() @Transform(trim) @IsString() search?: string;
  @IsOptional() @IsEnum(RequestStatus) status?: RequestStatus;
  @IsOptional() @IsEnum(RequestCategory) category?: RequestCategory;
  @IsOptional() @IsEnum(Priority) priority?: Priority;
  @IsOptional() @IsUUID() buildingId?: string;
  /** Only requests that are still open (not resolved/closed/rejected). */
  @IsOptional() @Transform(toBoolean) @IsBoolean() openOnly?: boolean;
  /** Only open requests past their resolution deadline. */
  @IsOptional() @Transform(toBoolean) @IsBoolean() overdueOnly?: boolean;
  @IsOptional() @Transform(toBoolean) @IsBoolean() escalatedOnly?: boolean;
  /** Managers: show only the requests they submitted themselves. */
  @IsOptional() @Transform(toBoolean) @IsBoolean() mine?: boolean;
  @IsOptional() @IsDateString() createdFrom?: string;
  @IsOptional() @IsDateString() createdTo?: string;
}

export class StatusNoteDto {
  @IsOptional() @Transform(trim) @IsString() @MaxLength(500) note?: string;
}

export class RejectRequestDto {
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(500) reason: string;
}

export class ConfirmResolutionDto {
  /** Satisfaction score from 1 (very unhappy) to 5 (very happy). */
  @Type(() => Number) @IsInt() @Min(1) @Max(5) rating: number;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(1000) comment?: string;
}

export class ReopenRequestDto {
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(500) reason: string;
}

export class AssetSummaryDto {
  id: string;
  code: string;
  name: string;
}

export class ServiceRequestResponseDto {
  id: string;
  code: string;
  title: string;
  category: RequestCategory;
  severity: Severity;
  urgency: Urgency;
  priority: Priority;
  isSafetyRelated: boolean;
  status: RequestStatus;
  building: BuildingSummaryDto;
  room: RoomSummaryDto | null;
  asset: AssetSummaryDto | null;
  requester: UserSummaryDto;
  createdAt: string;
  responseDueAt: string;
  resolutionDueAt: string;
  resolvedAt: string | null;
  slaState: SlaState;
  isEscalated: boolean;
  attachmentCount: number;
}

export class StatusHistoryEntryDto {
  fromStatus: RequestStatus | null;
  toStatus: RequestStatus;
  note: string | null;
  changedBy: string;
  changedByRole: string;
  changedAt: string;
}

export class RequestWorkOrderSummaryDto {
  id: string;
  code: string;
  status: string;
  technician: { id: string; fullName: string } | null;
  dueAt: string;
}

export class FeedbackDto {
  rating: number;
  comment: string | null;
  createdAt: string;
}

export class ServiceRequestDetailDto extends ServiceRequestResponseDto {
  description: string;
  locationDetails: string | null;
  preferredContact: ContactMethod;
  contactDetail: string | null;
  rejectionReason: string | null;
  acknowledgedAt: string | null;
  closedAt: string | null;
  attachments: AttachmentDto[];
  history: StatusHistoryEntryDto[];
  workOrders: RequestWorkOrderSummaryDto[];
  feedback: FeedbackDto | null;
  availableActions: RequestAction[];
}
