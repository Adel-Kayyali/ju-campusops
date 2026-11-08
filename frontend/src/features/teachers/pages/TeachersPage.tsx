import { Group, Paper, SegmentedControl, Select, SimpleGrid, TextInput } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconSearch } from '@tabler/icons-react';
import { useState } from 'react';
import { EmptyState } from '@/shared/components/EmptyState';
import { PageHeader } from '@/shared/components/PageHeader';
import { PaginationBar } from '@/shared/components/PaginationBar';
import { QueryState } from '@/shared/components/QueryState';
import type { TeacherStatus } from '@/shared/types/enums';
import { useTeacherDepartments, useTeachers } from '../api';
import { TeacherCard } from '../components/TeacherCard';
import { TeacherDetailDrawer } from '../components/TeacherDetailDrawer';

/** Directory of every teacher: who is free right now, office hours and contact details. */
export function TeachersPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [department, setDepartment] = useState<string | null>(null);
  const [status, setStatus] = useState<'ALL' | TeacherStatus>('ALL');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);

  const departments = useTeacherDepartments();
  const teachers = useTeachers({
    search: debouncedSearch || undefined,
    department: department ?? undefined,
    status: status === 'ALL' ? undefined : status,
    page,
    size: 24,
  });

  return (
    <>
      <PageHeader title="Teachers" description="Find a teacher, see whether they are free right now, their office hours and how to reach them." />
      <Paper withBorder radius="md" p="md" mb="md">
        <Group grow wrap="wrap" align="flex-end">
          <TextInput
            label="Search"
            placeholder="Name, department or office"
            leftSection={<IconSearch size={14} />}
            value={search}
            onChange={(e) => {
              setSearch(e.currentTarget.value);
              setPage(1);
            }}
          />
          <Select
            label="Department"
            placeholder="All departments"
            clearable
            data={departments.data ?? []}
            value={department}
            onChange={(v) => {
              setDepartment(v);
              setPage(1);
            }}
          />
          <SegmentedControl
            value={status}
            onChange={(v) => {
              setStatus(v as 'ALL' | TeacherStatus);
              setPage(1);
            }}
            data={[
              { value: 'ALL', label: 'All' },
              { value: 'FREE', label: 'Free' },
              { value: 'BUSY', label: 'Busy' },
            ]}
          />
        </Group>
      </Paper>
      <QueryState query={teachers}>
        {(data) =>
          data.content.length === 0 ? (
            <EmptyState title="No teacher found" description="Try another name or remove the filters." />
          ) : (
            <>
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
                {data.content.map((teacher) => (
                  <TeacherCard key={teacher.userId} teacher={teacher} onOpen={() => setSelected(teacher.userId)} />
                ))}
              </SimpleGrid>
              <PaginationBar page={data} onPageChange={setPage} />
            </>
          )
        }
      </QueryState>
      <TeacherDetailDrawer teacherId={selected} onClose={() => setSelected(null)} />
    </>
  );
}
