import { Weekday } from '@prisma/client';
import { currentSlot, slotsOn, sortByTime } from '../domain/timetable';
import { ScheduleEntryDto, TeacherDetailDto, TeacherResponseDto } from '../dto/teacher.dto';
import { TeacherWithSchedule } from '../repositories/teacher.repository';

export interface CampusMoment {
  weekday: Weekday;
  minutesOfDay: number;
}

export class TeacherMapper {
  static toResponse(teacher: TeacherWithSchedule, now: CampusMoment): TeacherResponseDto {
    const current = currentSlot(teacher.schedule, now.weekday, now.minutesOfDay);
    return {
      userId: teacher.user.id,
      fullName: teacher.user.fullName,
      title: teacher.title,
      department: teacher.department,
      officeLocation: teacher.officeLocation,
      email: teacher.contactEmail ?? teacher.user.email,
      phone: teacher.user.phone,
      status: teacher.status,
      statusChangedAt: teacher.statusChangedAt.toISOString(),
      currentActivity: current ? TeacherMapper.toEntry(current) : null,
      today: slotsOn(teacher.schedule, now.weekday).map(TeacherMapper.toEntry),
    };
  }

  static toDetail(teacher: TeacherWithSchedule, now: CampusMoment): TeacherDetailDto {
    return { ...TeacherMapper.toResponse(teacher, now), schedule: sortByTime(teacher.schedule).map(TeacherMapper.toEntry) };
  }

  static toEntry(entry: TeacherWithSchedule['schedule'][number]): ScheduleEntryDto {
    return {
      id: entry.id,
      type: entry.type,
      weekday: entry.weekday,
      startTime: entry.startTime,
      endTime: entry.endTime,
      title: entry.title,
      location: entry.location,
    };
  }
}
