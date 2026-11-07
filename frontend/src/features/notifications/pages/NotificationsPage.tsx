import { Button, Group, Paper, Stack, Switch, Text, UnstyledButton } from '@mantine/core';
import { IconChecks } from '@tabler/icons-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { EmptyState } from '@/shared/components/EmptyState';
import { PageHeader } from '@/shared/components/PageHeader';
import { PaginationBar } from '@/shared/components/PaginationBar';
import { QueryState } from '@/shared/components/QueryState';
import { formatDateTime, formatRelative } from '@/shared/utils/format';
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications, type AppNotification } from '../api';

/** Full list of the user's in-app notifications. */
export function NotificationsPage() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const notifications = useNotifications({ page, size: 20, unreadOnly });
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const navigate = useNavigate();

  const open = (notification: AppNotification) => {
    if (!notification.isRead) markRead.mutate(notification.id);
    if (notification.link) navigate(notification.link);
  };

  return (
    <>
      <PageHeader
        title="Notifications"
        actions={
          <Button variant="light" leftSection={<IconChecks size={16} />} loading={markAll.isPending} onClick={() => markAll.mutate()}>
            Mark all as read
          </Button>
        }
      />
      <Paper withBorder radius="md" p="md">
        <Group justify="flex-end" mb="sm">
          <Switch label="Unread only" checked={unreadOnly} onChange={(e) => { setUnreadOnly(e.currentTarget.checked); setPage(1); }} />
        </Group>
        <QueryState query={notifications}>
          {(data) =>
            data.content.length === 0 ? (
              <EmptyState title="No notifications" />
            ) : (
              <>
                <Stack gap={0}>
                  {data.content.map((n) => (
                    <UnstyledButton
                      key={n.id}
                      onClick={() => open(n)}
                      p="sm"
                      style={{ borderBottom: '1px solid var(--mantine-color-default-border)', background: n.isRead ? undefined : 'var(--mantine-color-blue-light)', borderRadius: 4 }}
                    >
                      <Group justify="space-between" align="flex-start" wrap="nowrap">
                        <div>
                          <Text size="sm" fw={n.isRead ? 400 : 700}>
                            {n.title}
                          </Text>
                          <Text size="sm" c="dimmed">
                            {n.message}
                          </Text>
                        </div>
                        <Text size="xs" c="dimmed" title={formatDateTime(n.createdAt)} style={{ whiteSpace: 'nowrap' }}>
                          {formatRelative(n.createdAt)}
                        </Text>
                      </Group>
                    </UnstyledButton>
                  ))}
                </Stack>
                <PaginationBar page={data} onPageChange={setPage} />
              </>
            )
          }
        </QueryState>
      </Paper>
    </>
  );
}
