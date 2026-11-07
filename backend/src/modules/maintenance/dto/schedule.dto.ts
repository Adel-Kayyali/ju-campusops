import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { IntervalUnit, Priority } from '@prisma/client';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class ScheduleQueryDto {
  @IsOptional() @IsUUID() assetId?: string;
  @IsOptional() @Transform(({ value }) => (value === undefined ? undefined : value === true || value === 'true')) @IsBoolean() activeOnly?: boolean;
}

export class CreateScheduleDto {
  @IsUUID() assetId: string;
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(120) title: string;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(1000) description?: string;
  @Type(() => Number) @IsInt() @Min(1) @Max(365) intervalValue: number;
  @IsEnum(IntervalUnit) intervalUnit: IntervalUnit;
  /** First due date (YYYY-MM-DD). */
  @IsDateString() nextDueDate: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(60) leadDays?: number;
  @IsOptional() @IsEnum(Priority) priority?: Priority;
  @IsOptional() @IsUUID() defaultTechnicianId?: string;
}

export class UpdateScheduleDto {
  @IsOptional() @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(120) title?: string;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(1000) description?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(365) intervalValue?: number;
  @IsOptional() @IsEnum(IntervalUnit) intervalUnit?: IntervalUnit;
  @IsOptional() @IsDateString() nextDueDate?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(60) leadDays?: number;
  @IsOptional() @IsEnum(Priority) priority?: Priority;
  @IsOptional() @IsUUID() defaultTechnicianId?: string | null;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class ScheduleResponseDto {
  id: string;
  title: string;
  description: string | null;
  asset: { id: string; code: string; name: string; building: { id: string; code: string; name: string } };
  intervalValue: number;
  intervalUnit: IntervalUnit;
  every: string;
  nextDueDate: string;
  leadDays: number;
  priority: Priority;
  defaultTechnicianId: string | null;
  isActive: boolean;
  isDueForGeneration: boolean;
  openWorkOrders: number;
  lastGeneratedAt: string | null;
}

export class GenerationResultDto {
  generated: number;
  workOrders: { id: string; code: string; title: string }[];
}
