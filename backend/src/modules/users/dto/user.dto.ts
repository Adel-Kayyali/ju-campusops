import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Role } from '@prisma/client';
import { PageQueryDto } from '../../../common/dto/page-query.dto';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class UserQueryDto extends PageQueryDto {
  /** Matches name, email or university ID. */
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsEnum(Role) role?: Role;
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : value === true || value === 'true'))
  @IsBoolean()
  isActive?: boolean;
}

export class CreateUserDto {
  @Transform(trim) @IsEmail() email: string;
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(120) fullName: string;
  @IsEnum(Role) role: Role;
  @IsString() @MaxLength(200) password: string;
  @IsOptional() @Transform(trim) @Matches(/^[0-9A-Za-z-]{4,20}$/, { message: 'universityId must be 4-20 letters/digits' }) universityId?: string;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(30) phone?: string;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(120) department?: string;
}

export class UpdateUserDto {
  @IsOptional() @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(120) fullName?: string;
  @IsOptional() @IsEnum(Role) role?: Role;
  @IsOptional() @Transform(trim) @Matches(/^[0-9A-Za-z-]{4,20}$/) universityId?: string;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(30) phone?: string;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(120) department?: string;
}

export class UpdateUserStatusDto {
  @IsBoolean() isActive: boolean;
}

export class ResetPasswordDto {
  @IsString() @MaxLength(200) newPassword: string;
}

export class UserResponseDto {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  universityId: string | null;
  phone: string | null;
  department: string | null;
  isActive: boolean;
  createdAt: string;
}

/** Compact user reference embedded in other responses. */
export class UserSummaryDto {
  id: string;
  fullName: string;
  universityId: string | null;
  email?: string;
}
