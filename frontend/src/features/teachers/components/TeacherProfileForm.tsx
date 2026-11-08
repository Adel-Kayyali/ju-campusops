import { Button, Group, Paper, SimpleGrid, TextInput, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';
import { notify } from '@/shared/utils/notify';
import { teachersApi, useMyTeacherMutation } from '../api';
import type { TeacherDetail, TeacherProfileInput } from '../types';

type Values = Required<TeacherProfileInput>;

/** The teacher's public information (name, title, department, office, contact). */
export function TeacherProfileForm({ teacher }: { teacher: TeacherDetail }) {
  const form = useForm<Values>({
    initialValues: { fullName: '', title: '', department: '', officeLocation: '', contactEmail: '', phone: '' },
    validate: {
      fullName: (v) => (v.trim() ? null : 'Required'),
      contactEmail: (v) => (!v || /^\S+@\S+\.\S+$/.test(v) ? null : 'Enter a valid e-mail'),
      phone: (v) => (!v || /^[0-9+\-\s()]{6,25}$/.test(v) ? null : 'Digits, spaces, +, - or () only'),
    },
  });

  useEffect(() => {
    form.setValues({
      fullName: teacher.fullName,
      title: teacher.title ?? '',
      department: teacher.department ?? '',
      officeLocation: teacher.officeLocation ?? '',
      contactEmail: teacher.email,
      phone: teacher.phone ?? '',
    });
    form.resetDirty();
  }, [teacher.userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useMyTeacherMutation(teachersApi.updateMyProfile);

  return (
    <Paper withBorder radius="md" p="md">
      <Title order={4} mb="sm">
        My information
      </Title>
      <form onSubmit={form.onSubmit((values) => save.mutate(values, { onSuccess: () => notify.success('Your information was saved'), onError: (error) => notify.error(error) }))}>
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput label="Full name" required {...form.getInputProps('fullName')} />
          <TextInput label="Title" placeholder="Dr., Prof., Eng." {...form.getInputProps('title')} />
          <TextInput label="Department" placeholder="Software Engineering" {...form.getInputProps('department')} />
          <TextInput label="Office" placeholder="ITC 305-A" {...form.getInputProps('officeLocation')} />
          <TextInput label="Contact e-mail" description="Shown to students and staff" {...form.getInputProps('contactEmail')} />
          <TextInput label="Phone" placeholder="07XXXXXXXX" {...form.getInputProps('phone')} />
        </SimpleGrid>
        <Group justify="flex-end" mt="md">
          <Button type="submit" loading={save.isPending} disabled={!form.isDirty()}>
            Save information
          </Button>
        </Group>
      </form>
    </Paper>
  );
}
