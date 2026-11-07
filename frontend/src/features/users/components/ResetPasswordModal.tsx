import { Button, Group, Modal, PasswordInput, Stack, Text } from '@mantine/core';
import { useEffect, useState } from 'react';
import { notify } from '@/shared/utils/notify';
import { usersApi, useUserMutation, type User } from '../api';

export function ResetPasswordModal({ user, onClose }: { user: User | null; onClose: () => void }) {
  const [password, setPassword] = useState('');
  useEffect(() => setPassword(''), [user]);
  const reset = useUserMutation((newPassword: string) => usersApi.resetPassword(user!.id, newPassword));

  return (
    <Modal opened={user !== null} onClose={onClose} title="Reset password" centered>
      <Stack>
        <Text size="sm">
          Set a new password for <b>{user?.fullName}</b> and give it to them in person.
        </Text>
        <PasswordInput label="New password" description="At least 8 characters" value={password} onChange={(e) => setPassword(e.currentTarget.value)} />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={password.length < 8}
            loading={reset.isPending}
            onClick={() =>
              reset.mutate(password, {
                onSuccess: () => {
                  notify.success('Password reset');
                  onClose();
                },
                onError: notify.error,
              })
            }
          >
            Reset password
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
