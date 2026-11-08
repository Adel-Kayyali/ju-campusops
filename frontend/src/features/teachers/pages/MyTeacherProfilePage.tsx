import { Stack, Title } from '@mantine/core';
import { PageHeader } from '@/shared/components/PageHeader';
import { QueryState } from '@/shared/components/QueryState';
import { useMyTeacherProfile } from '../api';
import { ScheduleEditor } from '../components/ScheduleEditor';
import { TeacherProfileForm } from '../components/TeacherProfileForm';
import { TeacherStatusToggle } from '../components/TeacherStatusToggle';
import { WeeklyTimetable } from '../components/WeeklyTimetable';

/** The teacher's own section: status button, public information and timetable. */
export function MyTeacherProfilePage() {
  const mine = useMyTeacherProfile();
  return (
    <>
      <PageHeader title="My teacher profile" description="Only you can change your status, information and timetable. Everyone can see them in the Teachers directory." />
      <QueryState query={mine}>
        {(teacher) => (
          <Stack gap="lg">
            <TeacherStatusToggle />
            <TeacherProfileForm teacher={teacher} />
            <ScheduleEditor teacher={teacher} />
            <div>
              <Title order={4} mb="sm">
                How others see your week
              </Title>
              <WeeklyTimetable schedule={teacher.schedule} currentId={teacher.currentActivity?.id} />
            </div>
          </Stack>
        )}
      </QueryState>
    </>
  );
}
