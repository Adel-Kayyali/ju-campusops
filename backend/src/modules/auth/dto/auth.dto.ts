import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Role } from '@prisma/client';
import { UserResponseDto } from '../../users/dto/user.dto';

export class LoginDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  password: string;
}

export class LoginResponseDto {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
  user: UserResponseDto;
}

export class ChangePasswordDto {
  @IsString() currentPassword: string;
  @IsString() @MaxLength(200) newPassword: string;
}

/** Roles anyone may choose when signing up. Other roles are created by an administrator. */
export const SELF_REGISTRATION_ROLES = [Role.STUDENT, Role.STAFF, Role.TEACHER] as const;
export type SelfRegistrationRole = (typeof SELF_REGISTRATION_ROLES)[number];

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class RegisterDto {
  @IsIn(SELF_REGISTRATION_ROLES) accountType: SelfRegistrationRole;
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(120) fullName: string;
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value)) @IsEmail() email: string;
  /** Required for students. */
  @IsOptional() @Transform(trim) @Matches(/^[0-9A-Za-z-]{4,20}$/, { message: 'universityId must be 4-20 letters/digits' }) universityId?: string;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(120) department?: string;
  @IsOptional() @Transform(trim) @Matches(/^[0-9+\-\s()]{6,25}$/, { message: 'phone must contain only digits, spaces, +, - or ()' }) phone?: string;
  @IsString() @MaxLength(200) password: string;
  /** Must be identical to password. */
  @IsString() @MaxLength(200) confirmPassword: string;
}
