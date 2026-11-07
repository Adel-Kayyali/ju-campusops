import { ActionIcon, Anchor, Divider, Group, Indicator, Popover, ScrollArea, Stack, Text, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconBell } from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router';
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications, useUnreadCount, type AppNotification } from '@/features/notifications/api';
import { formatRelative } from '@/shared/utils/format';

export function NotificationBell() {
  const [opened, { close, toggle }] = useDisclosure(false);
  const unread = useUnreadCount();
  const list = useNotifications({ page: 1, size: 8 });
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const navigate = useNavigate();
  const count = unread.data?.count ?? 0;

  const open = (notification: AppNotification) => {
    if (!notification.isRead) markRead.mutate(notification.id);
    close();
    if (notification.link) navigate(notification.link);
  };

  return (
    <Popover opened={opened} onChange={toggle} width={360} position="bottom-end" shadow="md">
      <Popover.Target>
        <Indicator label={count > 99 ? '99+' : count} size={16} disabled={count === 0} color="red" offset={4}>
          <ActionIcon variant="subtle" size="lg" onClick={toggle} aria-label="Notifications">
            <IconBell size={20} />
          </ActionIcon>
        </Indicator>
      </Popover.Target>
      <Popover.Dropdown p={0}>
        <Group justify="space-between" p="sm">
          <Text fw={600}>Notifications</Text>
          {count > 0 && (
            <Anchor size="xs" component="button" onClick={() => markAll.mutate()}>
              Mark all as read
            </Anchor>
          )}
        </Group>
        <Divider />
        <ScrollArea.Autosize mah={380}>
          <Stack gap={0}>
            {(list.data?.content ?? []).map((n) => (
              <UnstyledButton
                key={n.id}
                onClick={() => open(n)}
                p="sm"
                style={{ borderBottom: '1px solid var(--mantine-color-gray-2)', background: n.isRead ? undefined : 'var(--mantine-color-blue-0)' }}
              >
                <Text size="sm" fw={n.isRead ? 400 : 600} lineClamp={1}>
                  {n.title}
                </Text>
                <Text size="xs" c="dimmed" lineClamp={2}>
                  {n.message}
                </Text>
                <Text size="xs" c="dimmed" mt={2}>
                  {formatRelative(n.createdAt)}
                </Text>
              </UnstyledButton>
            ))}
            {list.data?.content.length === 0 && (
              <Text size="sm" c="dimmed" p="md" ta="center">
                You have no notifications.
              </Text>
            )}
          </Stack>
        </ScrollArea.Autosize>
        <Divider />
        <Anchor component={Link} to="/notifications" size="sm" display="block" ta="center" p="xs" onClick={close}>
          View all
        </Anchor>
      </Popover.Dropdown>
    </Popover>
  );
}
