import { Injectable } from '@nestjs/common';
import { Prisma, Role, TeacherProfile, TeacherStatus } from '@prisma/client';
import { BaseRepository } from '../../../database/base.repository';
import { TransactionManager } from '../../../database/transaction-manager';
import { TimetableSlot } from '../domain/timetable';

export const teacherInclude = {
  user: { select: { id: true, fullName: true, email: true, phone: true, isActive: true } },
  schedule: true,
} satisfies Prisma.TeacherProfileInclude;

export type TeacherWithSchedule = Prisma.TeacherProfileGetPayload<{ include: typeof teacherInclude }>;

@Injectable()
export class TeacherRepository extends BaseRepository {
  constructor(transactionManager: TransactionManager) {
    super(transactionManager);
  }

  async findPage(where: Prisma.TeacherProfileWhereInput, skip: number, take: number): Promise<[TeacherWithSchedule[], number]> {
    const scoped: Prisma.TeacherProfileWhereInput = { AND: [where, { user: { isActive: true, role: Role.TEACHER } }] };
    return Promise.all([
      this.db.teacherProfile.findMany({ where: scoped, include: teacherInclude, orderBy: { user: { fullName: 'asc' } }, skip, take }),
      this.db.teacherProfile.count({ where: scoped }),
    ]);
  }

  findByUserId(userId: string): Promise<TeacherWithSchedule | null> {
    return this.db.teacherProfile.findUnique({ where: { userId }, include: teacherInclude });
  }

  /** Every teacher account has a profile; it is created on first use if missing. */
  ensureProfile(userId: string): Promise<TeacherProfile> {
    return this.db.teacherProfile.upsert({ where: { userId }, create: { userId }, update: {} });
  }

  updateProfile(userId: string, data: Prisma.TeacherProfileUpdateInput): Promise<TeacherProfile> {
    return this.db.teacherProfile.update({ where: { userId }, data });
  }

  updateUser(userId: string, data: Prisma.UserUpdateInput): Promise<unknown> {
    return this.db.user.update({ where: { id: userId }, data });
  }

  setStatus(userId: string, status: TeacherStatus): Promise<TeacherProfile> {
    return this.db.teacherProfile.update({ where: { userId }, data: { status, statusChangedAt: new Date() } });
  }

  /** Replaces the whole weekly timetable (simple and always consistent). */
  async replaceSchedule(profileId: string, slots: readonly TimetableSlot[]): Promise<void> {
    await this.db.teacherScheduleEntry.deleteMany({ where: { profileId } });
    if (slots.length > 0) {
      await this.db.teacherScheduleEntry.createMany({
        data: slots.map((slot) => ({ ...slot, location: slot.location ?? null, profileId })),
      });
    }
  }

  departments(): Promise<string[]> {
    return this.db.teacherProfile
      .findMany({ where: { department: { not: null }, user: { isActive: true } }, select: { department: true }, distinct: ['department'], orderBy: { department: 'asc' } })
      .then((rows) => rows.map((row) => row.department!));
  }
}
