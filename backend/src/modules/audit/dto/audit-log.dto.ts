import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';
import { PageQueryDto } from '../../../common/dto/page-query.dto';

export class AuditLogQueryDto extends PageQueryDto {
  @IsOptional() @IsString() entityType?: string;
  @IsOptional() @IsUUID() entityId?: string;
  @IsOptional() @IsUUID() actorId?: string;
  @IsOptional() @IsString() action?: string;
  /** Inclusive start date (YYYY-MM-DD). */
  @IsOptional() @IsDateString() from?: string;
  /** Inclusive end date (YYYY-MM-DD). */
  @IsOptional() @IsDateString() to?: string;
}

export class AuditActorDto {
  id: string;
  fullName: string;
  role: string;
}

export class AuditLogResponseDto {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  actor: AuditActorDto | null;
  createdAt: string;
}
