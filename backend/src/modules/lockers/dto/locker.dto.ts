import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { LockerSize } from '@prisma/client';
import { PageQueryDto } from '../../../common/dto/page-query.dto';
import { BuildingSummaryDto } from '../../locations/dto/location.dto';
import { UserSummaryDto } from '../../users/dto/user.dto';
import { LockerStatus, SubscriptionState } from '../domain/locker-status';
import { SubscriptionResponseDto } from './subscription.dto';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

/** Filters of the lockers screen. Every filter is optional and they are combined with AND. */
export class LockerQueryDto extends PageQueryDto {
  /** Locker code, e.g. "ENG-1". */
  @IsOptional() @Transform(trim) @IsString() code?: string;
  /** Name or university ID of the student holding the locker. */
  @IsOptional() @Transform(trim) @IsString() student?: string;
  @IsOptional() @IsUUID() buildingId?: string;
  @IsOptional() @Type(() => Number) @IsInt() floor?: number;
  @IsOptional() @Transform(trim) @IsString() zone?: string;
  /** Locker size (named lockerSize because "size" is the page size). */
  @IsOptional() @IsEnum(LockerSize) lockerSize?: LockerSize;
  @IsOptional() @IsEnum(LockerStatus) status?: LockerStatus;
  /** Subscriptions ending on/after this date (YYYY-MM-DD). */
  @IsOptional() @IsDateString() endsFrom?: string;
  /** Subscriptions ending on/before this date (YYYY-MM-DD). */
  @IsOptional() @IsDateString() endsTo?: string;
}

export class CreateLockerDto {
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(20) code: string;
  @IsUUID() buildingId: string;
  @Type(() => Number) @IsInt() @Min(-5) @Max(50) floor: number;
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(40) zone: string;
  @IsEnum(LockerSize) size: LockerSize;
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(1000) monthlyFee: number;
}

export class UpdateLockerDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(-5) @Max(50) floor?: number;
  @IsOptional() @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(40) zone?: string;
  @IsOptional() @IsEnum(LockerSize) size?: LockerSize;
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(1000) monthlyFee?: number;
}

export class SetLockerServiceStatusDto {
  @IsBoolean() isOutOfService: boolean;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(300) note?: string;
}

/** The subscription that explains a locker's current status. */
export class LockerOccupancyDto {
  subscriptionId: string;
  student: UserSummaryDto;
  startDate: string;
  endDate: string;
  state: SubscriptionState;
  daysRemaining: number;
}

export class LockerResponseDto {
  id: string;
  code: string;
  building: BuildingSummaryDto;
  floor: number;
  zone: string;
  size: LockerSize;
  monthlyFee: number;
  isOutOfService: boolean;
  outOfServiceNote: string | null;
  status: LockerStatus;
  occupancy: LockerOccupancyDto | null;
}

export class LockerStatusCountDto {
  status: LockerStatus;
  count: number;
}

export class LockerSummaryDto {
  totalLockers: number;
  byStatus: LockerStatusCountDto[];
  /** Occupied (incl. expiring / expired-unreleased) divided by in-service lockers, 0..100. */
  occupancyRate: number;
  expiringThisWeek: number;
  activeSubscriptions: number;
  cashCollectedThisMonth: number;
}

export class LockerDetailResponseDto {
  locker: LockerResponseDto;
  /** Every subscription of this locker, newest first. */
  history: SubscriptionResponseDto[];
}
