import { Injectable } from '@nestjs/common';
import { Prisma, TeacherStatus } from '@prisma/client';
import { PageDto } from '../../../common/dto/page.dto';
import { EntityNotFoundException } from '../../../common/exceptions/domain.exceptions';
import { CampusClock } from '../../../common/time/campus-clock';
import { Transactional } from '../../../database/transactional.decorator';
import { AuditAction } from '../../audit/domain/audit-action';
import { AuditService } from '../../audit/services/audit.service';
import { validateTimetable, WEEK } from '../domain/timetable';
import { ReplaceScheduleDto, TeacherDetailDto, TeacherQueryDto, TeacherResponseDto, UpdateMyTeacherProfileDto } from '../dto/teacher.dto';
import { CampusMoment, TeacherMapper } from '../mappers/teacher.mapper';
import { TeacherRepository, TeacherWithSchedule } from '../repositories/teacher.repository';

/**
 * Teachers directory. Everyone can search teachers and see their status and timetable;
 * a teacher can change only HIS OWN profile, timetable and Free/Busy status
 * (every write method works on the authenticated user's id, never on an id from the request).
 */
@Injectable()
export class TeacherService {
  constructor(
    private readonly repository: TeacherRepository,
    private readonly auditService: AuditService,
    private readonly clock: CampusClock,
  ) {}

  // ------------------------------------------------------------------ queries

  async search(query: TeacherQueryDto): Promise<PageDto<TeacherResponseDto>> {
    const text = query.search?.trim();
    const where: Prisma.TeacherProfileWhereInput = {
      status: query.status,
      department: query.department ? { equals: query.department, mode: 'insensitive' } : undefined,
      OR: text
        ? [
            { user: { fullName: { contains: text, mode: 'insensitive' } } },
            { department: { contains: text, mode: 'insensitive' } },
            { title: { contains: text, mode: 'insensitive' } },
            { officeLocation: { contains: text, mode: 'insensitive' } },
          ]
        : undefined,
    };
    const [teachers, total] = await this.repository.findPage(where, query.skip, query.take);
    const now = this.campusNow();
    return PageDto.of(teachers.map((teacher) => TeacherMapper.toResponse(teacher, now)), total, query.page, query.size);
  }

  async findOne(userId: string): Promise<TeacherDetailDto> {
    const teacher = await this.repository.findByUserId(userId);
    if (!teacher || !teacher.user.isActive) {
      throw new EntityNotFoundException('Teacher', userId);
    }
    return TeacherMapper.toDetail(teacher, this.campusNow());
  }

  departments(): Promise<string[]> {
    return this.repository.departments();
  }

  // ------------------------------------------------- the teacher's own data

  @Transactional()
  async getMine(userId: string): Promise<TeacherDetailDto> {
    await this.repository.ensureProfile(userId);
    return TeacherMapper.toDetail(await this.getProfile(userId), this.campusNow());
  }

  @Transactional()
  async updateMyProfile(userId: string, dto: UpdateMyTeacherProfileDto): Promise<TeacherDetailDto> {
    await this.repository.ensureProfile(userId);
    await this.repository.updateProfile(userId, {
      title: emptyToNull(dto.title),
      department: emptyToNull(dto.department),
      officeLocation: emptyToNull(dto.officeLocation),
      contactEmail: emptyToNull(dto.contactEmail?.toLowerCase()),
    });
    if (dto.fullName !== undefined || dto.phone !== undefined) {
      await this.repository.updateUser(userId, { fullName: dto.fullName, phone: emptyToNull(dto.phone) });
    }
    await this.auditService.record({ actorId: userId, action: AuditAction.TEACHER_PROFILE_UPDATED, entityType: 'TeacherProfile', entityId: userId, details: { ...dto } });
    return TeacherMapper.toDetail(await this.getProfile(userId), this.campusNow());
  }

  @Transactional()
  async replaceMySchedule(userId: string, dto: ReplaceScheduleDto): Promise<TeacherDetailDto> {
    validateTimetable(dto.entries);
    const profile = await this.repository.ensureProfile(userId);
    await this.repository.replaceSchedule(profile.id, dto.entries);
    await this.auditService.record({ actorId: userId, action: AuditAction.TEACHER_SCHEDULE_UPDATED, entityType: 'TeacherProfile', entityId: userId, details: { entries: dto.entries.length } });
    return TeacherMapper.toDetail(await this.getProfile(userId), this.campusNow());
  }

  @Transactional()
  async setMyStatus(userId: string, status: TeacherStatus): Promise<TeacherDetailDto> {
    const profile = await this.repository.ensureProfile(userId);
    if (profile.status !== status) {
      await this.repository.setStatus(userId, status);
      await this.auditService.record({ actorId: userId, action: AuditAction.TEACHER_STATUS_CHANGED, entityType: 'TeacherProfile', entityId: userId, details: { from: profile.status, to: status } });
    }
    return TeacherMapper.toDetail(await this.getProfile(userId), this.campusNow());
  }

  // ------------------------------------------------------------------ helpers

  private async getProfile(userId: string): Promise<TeacherWithSchedule> {
    const teacher = await this.repository.findByUserId(userId);
    if (!teacher) {
      throw new EntityNotFoundException('Teacher', userId);
    }
    return teacher;
  }

  private campusNow(): CampusMoment {
    const { weekdayIndex, minutesOfDay } = this.clock.localTime();
    return { weekday: WEEK[weekdayIndex], minutesOfDay };
  }
}

function emptyToNull(value: string | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  return value.trim() === '' ? null : value;
}
