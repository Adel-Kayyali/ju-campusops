import { Button, Group, Modal, PasswordInput, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useMutation } from '@tanstack/react-query';
import { notify } from '@/shared/utils/notify';
import { useAuth } from './AuthContext';
import { authApi } from './authApi';

export function ChangePasswordModal({ opened, onClose }: { opened: boolean; onClose: () => void }) {
  const form = useForm({
    initialValues: { currentPassword: '', newPassword: '', confirm: '' },
    validate: {
      currentPassword: (v) => (v ? null : 'Required'),
      newPassword: (v) => (v.length >= 8 ? null : 'At least 8 characters'),
      confirm: (v, values) => (v === values.newPassword ? null : 'Passwords do not match'),
    },
  });
  const { logout } = useAuth();
  const mutation = useMutation({
    mutationFn: (values: typeof form.values) => authApi.changePassword(values.currentPassword, values.newPassword),
    onSuccess: () => {
      // The API signs the user out everywhere after a password change.
      notify.success('Your password has been changed. Please sign in with the new password.');
      form.reset();
      onClose();
      logout();
    },
    onError: (error) => notify.error(error),
  });

  return (
    <Modal opened={opened} onClose={onClose} title="Change password" centered>
      <form onSubmit={form.onSubmit((values) => mutation.mutate(values))}>
        <Stack>
          <PasswordInput label="Current password" {...form.getInputProps('currentPassword')} />
          <PasswordInput label="New password" {...form.getInputProps('newPassword')} />
          <PasswordInput label="Confirm new password" {...form.getInputProps('confirm')} />
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              Save
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
