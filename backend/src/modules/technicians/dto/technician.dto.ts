import { Type } from 'class-transformer';
import { ArrayUnique, IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { RequestCategory } from '@prisma/client';
import { BuildingSummaryDto } from '../../locations/dto/location.dto';

export class TechnicianResponseDto {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  skills: RequestCategory[];
  homeBuilding: BuildingSummaryDto | null;
  isAvailable: boolean;
  maxOpenOrders: number;
  openWorkOrders: number;
}

export class UpdateTechnicianProfileDto {
  @IsOptional() @IsArray() @ArrayUnique() @IsEnum(RequestCategory, { each: true }) skills?: RequestCategory[];
  @IsOptional() @IsUUID() homeBuildingId?: string | null;
  @IsOptional() @IsBoolean() isAvailable?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(30) maxOpenOrders?: number;
}

export class UpdateAvailabilityDto {
  @IsBoolean() isAvailable: boolean;
}

export class SuggestionQueryDto {
  @IsEnum(RequestCategory) category: RequestCategory;
  @IsUUID() buildingId: string;
}

export class TechnicianSuggestionDto {
  userId: string;
  fullName: string;
  score: number;
  openWorkOrders: number;
  reasons: string[];
  isRecommended: boolean;
}
