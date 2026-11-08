import type { PageParams } from '@/api/types';
import type { ScheduleEntryType, TeacherStatus, Weekday } from '@/shared/types/enums';

export interface ScheduleEntry {
  id: string;
  type: ScheduleEntryType;
  weekday: Weekday;
  startTime: string;
  endTime: string;
  title: string;
  location: string | null;
}

export interface Teacher {
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
  currentActivity: ScheduleEntry | null;
  today: ScheduleEntry[];
}

export interface TeacherDetail extends Teacher {
  schedule: ScheduleEntry[];
}

export interface TeacherQuery extends PageParams {
  search?: string;
  department?: string;
  status?: TeacherStatus;
}

export interface TeacherProfileInput {
  fullName?: string;
  title?: string;
  department?: string;
  officeLocation?: string;
  contactEmail?: string;
  phone?: string;
}

export type ScheduleEntryInput = Omit<ScheduleEntry, 'id' | 'location'> & { location?: string };

/** "Dr. Hana Qudah" */
export function displayName(teacher: Pick<Teacher, 'title' | 'fullName'>): string {
  return teacher.title ? `${teacher.title} ${teacher.fullName}` : teacher.fullName;
}
