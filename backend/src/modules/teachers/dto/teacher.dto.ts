import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, ValidateNested } from 'class-validator';
import { ScheduleEntryType, TeacherStatus, Weekday } from '@prisma/client';
import { PageQueryDto } from '../../../common/dto/page-query.dto';
import { MAX_SCHEDULE_ENTRIES, TIME_PATTERN } from '../domain/timetable';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class TeacherQueryDto extends PageQueryDto {
  /** Name, department, title or office. */
  @IsOptional() @Transform(trim) @IsString() search?: string;
  @IsOptional() @Transform(trim) @IsString() department?: string;
  @IsOptional() @IsEnum(TeacherStatus) status?: TeacherStatus;
}

export class UpdateMyTeacherProfileDto {
  @IsOptional() @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(120) fullName?: string;
  /** e.g. "Dr.", "Prof.", "Eng." */
  @IsOptional() @Transform(trim) @IsString() @MaxLength(40) title?: string;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(120) department?: string;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(120) officeLocation?: string;
  /** Public contact e-mail (the login e-mail is used when empty). */
  @IsOptional() @Transform(trim) @IsEmail() contactEmail?: string;
  @IsOptional() @Transform(trim) @Matches(/^[0-9+\-\s()]{6,25}$/, { message: 'phone must contain only digits, spaces, +, - or ()' }) phone?: string;
}

export class ScheduleEntryInputDto {
  @IsEnum(ScheduleEntryType) type: ScheduleEntryType;
  @IsEnum(Weekday) weekday: Weekday;
  @Matches(TIME_PATTERN, { message: 'startTime must be HH:MM' }) startTime: string;
  @Matches(TIME_PATTERN, { message: 'endTime must be HH:MM' }) endTime: string;
  /** Course name for a lecture, e.g. "Software Engineering (Section 2)". */
  @Transform(trim) @IsString() @IsNotEmpty() @MaxLength(120) title: string;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(120) location?: string;
}

export class ReplaceScheduleDto {
  @IsArray()
  @ArrayMaxSize(MAX_SCHEDULE_ENTRIES)
  @ValidateNested({ each: true })
  @Type(() => ScheduleEntryInputDto)
  entries: ScheduleEntryInputDto[];
}

export class SetTeacherStatusDto {
  @IsEnum(TeacherStatus) status: TeacherStatus;
}

export class ScheduleEntryDto {
  id: string;
  type: ScheduleEntryType;
  weekday: Weekday;
  startTime: string;
  endTime: string;
  title: string;
  location: string | null;
}

export class TeacherResponseDto {
  userId: string;
  fullName: string;
  title: string | null;
  department: string | null;
  officeLocation: string | null;
  email: string;
  phone: string | null;
  status: TeacherStatus;
  statusChangedAt: string;
  /** What the timetable says the teacher is doing right now (campus time). */
  currentActivity: ScheduleEntryDto | null;
  today: ScheduleEntryDto[];
}

export class TeacherDetailDto extends TeacherResponseDto {
  /** The whole week, sorted by day and time. */
  schedule: ScheduleEntryDto[];
}
