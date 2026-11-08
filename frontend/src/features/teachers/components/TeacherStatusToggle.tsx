import { Button, Group, Paper, Stack, Text, Tooltip } from '@mantine/core';
import { IconCircleCheck, IconCircleX } from '@tabler/icons-react';
import { formatRelative } from '@/shared/utils/format';
import { notify } from '@/shared/utils/notify';
import { teachersApi, useMyTeacherMutation, useMyTeacherProfile } from '../api';

/**
 * The one-click Free / Busy switch of the logged-in teacher.
 * `compact` is the small version shown in the header on every page.
 */
export function TeacherStatusToggle({ compact = false }: { compact?: boolean }) {
  const mine = useMyTeacherProfile();
  const setStatus = useMyTeacherMutation(teachersApi.setMyStatus);
  const status = mine.data?.status;
  const isFree = status === 'FREE';
  const next = isFree ? 'BUSY' : 'FREE';

  const toggle = () =>
    setStatus.mutate(next, {
      onSuccess: (updated) => notify.success(updated.status === 'FREE' ? 'Everyone now sees you as Free' : 'Everyone now sees you as Busy', 'Status updated'),
      onError: (error) => notify.error(error),
    });

  if (compact) {
    return (
      <Tooltip label={status ? `Click to switch to ${next === 'FREE' ? 'Free' : 'Busy'}` : 'Loading…'}>
        <Button
          size="xs"
          radius="xl"
          color={isFree ? 'green' : 'red'}
          leftSection={isFree ? <IconCircleCheck size={16} /> : <IconCircleX size={16} />}
          loading={mine.isLoading || setStatus.isPending}
          disabled={!status}
          onClick={toggle}
        >
          {isFree ? 'Free' : 'Busy'}
        </Button>
      </Tooltip>
    );
  }

  return (
    <Paper withBorder radius="md" p="lg" bg={isFree ? 'var(--mantine-color-green-light)' : 'var(--mantine-color-red-light)'}>
      <Group justify="space-between" wrap="wrap" gap="md">
        <Stack gap={2}>
          <Text size="sm" c="dimmed">
            Your current status
          </Text>
          <Text fw={800} fz={32} c={isFree ? 'green.8' : 'red.8'} lh={1.1}>
            {status ? (isFree ? 'FREE' : 'BUSY') : '…'}
          </Text>
          {mine.data && (
            <Text size="xs" c="dimmed">
              Changed {formatRelative(mine.data.statusChangedAt)}. Students and staff see this in the Teachers directory.
            </Text>
          )}
        </Stack>
        <Button size="lg" radius="xl" color={isFree ? 'red' : 'green'} leftSection={isFree ? <IconCircleX size={22} /> : <IconCircleCheck size={22} />} loading={setStatus.isPending} disabled={!status} onClick={toggle}>
          {isFree ? "I'm busy now" : "I'm free now"}
        </Button>
      </Group>
    </Paper>
  );
}
