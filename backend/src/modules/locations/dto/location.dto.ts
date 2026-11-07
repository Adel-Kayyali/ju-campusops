import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { RoomType } from '@prisma/client';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateBuildingDto {
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(10) code: string;
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(100) name: string;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(60) campus?: string;
  @IsOptional() @IsInt() @Min(1) @Max(50) floors?: number;
}

export class UpdateBuildingDto {
  @IsOptional() @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(100) name?: string;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(60) campus?: string;
  @IsOptional() @IsInt() @Min(1) @Max(50) floors?: number;
}

export class CreateRoomDto {
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(20) code: string;
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(100) name: string;
  @IsOptional() @IsInt() @Min(-5) @Max(50) floor?: number;
  @IsOptional() @IsEnum(RoomType) type?: RoomType;
}

export class UpdateRoomDto {
  @IsOptional() @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(100) name?: string;
  @IsOptional() @IsInt() @Min(-5) @Max(50) floor?: number;
  @IsOptional() @IsEnum(RoomType) type?: RoomType;
}

export class BuildingResponseDto {
  id: string;
  code: string;
  name: string;
  campus: string;
  floors: number;
  roomCount: number;
  lockerCount: number;
  assetCount: number;
}

export class RoomResponseDto {
  id: string;
  buildingId: string;
  code: string;
  name: string;
  floor: number;
  type: RoomType;
}

/** Compact location reference embedded in other responses. */
export class BuildingSummaryDto {
  id: string;
  code: string;
  name: string;
}

export class RoomSummaryDto {
  id: string;
  code: string;
  name: string;
}
