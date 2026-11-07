import { Transform, Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min } from 'class-validator';
import { LockerSize, PaymentMethod, SubscriptionStatus } from '@prisma/client';
import { PageQueryDto } from '../../../common/dto/page-query.dto';
import { BuildingSummaryDto } from '../../locations/dto/location.dto';
import { UserSummaryDto } from '../../users/dto/user.dto';
import { SubscriptionState } from '../domain/locker-status';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

/**
 * How long the locker is rented: EITHER a preset number of months (1-4 in the UI)
 * OR an explicit end date chosen in the date-range picker.
 */
export class PeriodInputDto {
  /** First day of the subscription (YYYY-MM-DD). */
  @IsDateString() startDate: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(12) durationMonths?: number;

  /** Last day of the subscription, inclusive (YYYY-MM-DD). */
  @IsOptional() @IsDateString() endDate?: string;
}

export class QuoteSubscriptionDto extends PeriodInputDto {
  @IsUUID() lockerId: string;
}

export class StartSubscriptionDto extends PeriodInputDto {
  @IsUUID() lockerId: string;
  @IsUUID() studentId: string;

  @IsOptional() @IsEnum(PaymentMethod) paymentMethod?: PaymentMethod;

  /** Use a different amount than the calculated price (discount, etc.). */
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(10000) amountOverride?: number;

  /** Number printed on the paper receipt. Generated automatically when empty. */
  @IsOptional() @Transform(trim) @Matches(/^[A-Za-z0-9-]{3,30}$/) receiptNumber?: string;

  @IsOptional() @Transform(trim) @IsString() @MaxLength(500) notes?: string;
}

export class ExtendSubscriptionDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(12) durationMonths?: number;
  @IsOptional() @IsDateString() newEndDate?: string;
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(10000) amountOverride?: number;
  @IsOptional() @Transform(trim) @Matches(/^[A-Za-z0-9-]{3,30}$/) receiptNumber?: string;
}

export class EndSubscriptionDto {
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(300) reason: string;
}

export class SubscriptionQueryDto extends PageQueryDto {
  @IsOptional() @IsUUID() lockerId?: string;
  @IsOptional() @IsUUID() studentId?: string;
  /** Name or university ID of the student. */
  @IsOptional() @Transform(trim) @IsString() student?: string;
  @IsOptional() @IsEnum(SubscriptionStatus) status?: SubscriptionStatus;
}

export class QuoteResponseDto {
  startDate: string;
  endDate: string;
  days: number;
  billableMonths: number;
  monthlyFee: number;
  amount: number;
  /** Set when the period conflicts with another subscription of the same locker. */
  conflict: { subscriptionId: string; startDate: string; endDate: string } | null;
}

export class PaymentResponseDto {
  id: string;
  amount: number;
  method: PaymentMethod;
  receiptNumber: string;
  periodStart: string;
  periodEnd: string;
  receivedBy: string;
  receivedAt: string;
}

export class SubscriptionLockerDto {
  id: string;
  code: string;
  building: BuildingSummaryDto;
  floor: number;
  zone: string;
  size: LockerSize;
}

export class SubscriptionResponseDto {
  id: string;
  locker: SubscriptionLockerDto;
  student: UserSummaryDto;
  startDate: string;
  endDate: string;
  status: SubscriptionStatus;
  state: SubscriptionState;
  daysRemaining: number;
  totalPaid: number;
  payments: PaymentResponseDto[];
  notes: string | null;
  createdBy: string;
  endedAt: string | null;
  endedBy: string | null;
  endReason: string | null;
  createdAt: string;
}
