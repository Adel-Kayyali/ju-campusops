import { Button, Group, Modal, PasswordInput, Select, SimpleGrid, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';
import { ROLES, type Role } from '@/shared/types/enums';
import { toOptions } from '@/shared/utils/labels';
import { notify } from '@/shared/utils/notify';
import { usersApi, useUserMutation, type User } from '../api';

interface FormValues {
  email: string;
  fullName: string;
  role: Role;
  password: string;
  universityId: string;
  phone: string;
  department: string;
}

const EMPTY: FormValues = { email: '', fullName: '', role: 'STUDENT', password: '', universityId: '', phone: '', department: '' };

/** Creates a user account or edits its profile and role (administrators only). */
export function UserFormModal({ opened, user, onClose }: { opened: boolean; user?: User | null; onClose: () => void }) {
  const isEdit = Boolean(user);
  const form = useForm<FormValues>({
    initialValues: EMPTY,
    validate: {
      email: (v) => (isEdit || /^\S+@\S+\.\S+$/.test(v) ? null : 'Enter a valid email'),
      fullName: (v) => (v.trim() ? null : 'Required'),
      password: (v) => (isEdit || v.length >= 8 ? null : 'At least 8 characters'),
      universityId: (v, values) =>
        values.role === 'STUDENT' && !v.trim() ? 'Students must have a university ID' : v && !/^[0-9A-Za-z-]{4,20}$/.test(v) ? '4-20 letters or digits' : null,
    },
  });

  useEffect(() => {
    if (!opened) return;
    form.setValues(
      user
        ? { email: user.email, fullName: user.fullName, role: user.role, password: '', universityId: user.universityId ?? '', phone: user.phone ?? '', department: user.department ?? '' }
        : EMPTY,
    );
    form.clearErrors();
  }, [opened, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useUserMutation((v: FormValues) => {
    const profile = {
      fullName: v.fullName.trim(),
      role: v.role,
      universityId: v.universityId.trim() || undefined,
      phone: v.phone.trim() || undefined,
      department: v.department.trim() || undefined,
    };
    return user ? usersApi.update(user.id, profile) : usersApi.create({ ...profile, email: v.email.trim(), password: v.password });
  });

  return (
    <Modal opened={opened} onClose={onClose} title={isEdit ? `Edit ${user?.fullName}` : 'New user'} size="lg" centered>
      <form
        onSubmit={form.onSubmit((values) =>
          save.mutate(values, {
            onSuccess: () => {
              notify.success(isEdit ? 'User updated' : 'User created');
              onClose();
            },
            onError: notify.error,
          }),
        )}
      >
        <Stack>
          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <TextInput label="Email" disabled={isEdit} {...form.getInputProps('email')} />
            <TextInput label="Full name" {...form.getInputProps('fullName')} />
            <Select label="Role" data={toOptions(ROLES)} allowDeselect={false} value={form.values.role} onChange={(v) => form.setFieldValue('role', v as Role)} />
            <TextInput label="University ID" description={form.values.role === 'STUDENT' ? 'Required for students' : 'Optional'} {...form.getInputProps('universityId')} />
            <TextInput label="Phone" {...form.getInputProps('phone')} />
            <TextInput label="Department" {...form.getInputProps('department')} />
          </SimpleGrid>
          {!isEdit && <PasswordInput label="Initial password" description="At least 8 characters" {...form.getInputProps('password')} />}
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={save.isPending}>
              Save
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
