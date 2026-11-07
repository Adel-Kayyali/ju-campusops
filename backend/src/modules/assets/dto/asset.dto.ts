import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { AssetStatus, AssetType } from '@prisma/client';
import { PageQueryDto } from '../../../common/dto/page-query.dto';
import { BuildingSummaryDto, RoomSummaryDto } from '../../locations/dto/location.dto';
import { WarrantyStatus } from '../domain/warranty';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class AssetQueryDto extends PageQueryDto {
  /** Code, name, serial number or manufacturer. */
  @IsOptional() @Transform(trim) @IsString() search?: string;
  @IsOptional() @IsUUID() buildingId?: string;
  @IsOptional() @IsUUID() roomId?: string;
  @IsOptional() @IsEnum(AssetType) type?: AssetType;
  @IsOptional() @IsEnum(AssetStatus) status?: AssetStatus;
  @IsOptional() @IsEnum(WarrantyStatus) warranty?: WarrantyStatus;
}

export class CreateAssetDto {
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(30) code: string;
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(120) name: string;
  @IsEnum(AssetType) type: AssetType;
  @IsUUID() buildingId: string;
  @IsOptional() @IsUUID() roomId?: string;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(80) manufacturer?: string;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(80) model?: string;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(80) serialNumber?: string;
  @IsOptional() @IsDateString() installDate?: string;
  @IsOptional() @IsDateString() warrantyExpiry?: string;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(1000) notes?: string;
}

export class UpdateAssetDto {
  @IsOptional() @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(120) name?: string;
  @IsOptional() @IsEnum(AssetType) type?: AssetType;
  @IsOptional() @IsEnum(AssetStatus) status?: AssetStatus;
  @IsOptional() @IsUUID() buildingId?: string;
  @IsOptional() @IsUUID() roomId?: string | null;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(80) manufacturer?: string;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(80) model?: string;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(80) serialNumber?: string;
  @IsOptional() @IsDateString() installDate?: string;
  @IsOptional() @IsDateString() warrantyExpiry?: string;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(1000) notes?: string;
}

export class AssetResponseDto {
  id: string;
  code: string;
  name: string;
  type: AssetType;
  status: AssetStatus;
  building: BuildingSummaryDto;
  room: RoomSummaryDto | null;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  installDate: string | null;
  warrantyExpiry: string | null;
  warrantyStatus: WarrantyStatus;
  notes: string | null;
  openWorkOrders: number;
}

export class MaintenanceRecordDto {
  workOrderId: string;
  code: string;
  type: string;
  title: string;
  status: string;
  technician: string | null;
  createdAt: string;
  completedAt: string | null;
  repairNotes: string | null;
}

export class AssetScheduleSummaryDto {
  id: string;
  title: string;
  every: string;
  nextDueDate: string;
  isActive: boolean;
}

export class AssetDetailResponseDto {
  asset: AssetResponseDto;
  maintenanceHistory: MaintenanceRecordDto[];
  schedules: AssetScheduleSummaryDto[];
  /** Corrective work orders in the last 90 days (repeat-failure indicator). */
  failuresLast90Days: number;
}
