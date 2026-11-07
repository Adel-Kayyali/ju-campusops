import { ActionIcon, AppShell, Avatar, Box, Burger, Group, Menu, NavLink, ScrollArea, Stack, Text, ThemeIcon, Title, Tooltip, useMantineColorScheme } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconBuildingCommunity, IconKey, IconLogout, IconMoon, IconSun } from '@tabler/icons-react';
import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { useAuth } from '@/auth/AuthContext';
import { ChangePasswordModal } from '@/auth/ChangePasswordModal';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { NAVIGATION } from './navigation';
import { NotificationBell } from './NotificationBell';

/** Application frame: header, role-filtered sidebar and the current page. */
export function AppLayout() {
  const [mobileOpened, { toggle: toggleMobile, close: closeMobile }] = useDisclosure();
  const [passwordOpened, setPasswordOpened] = useState(false);
  const { user, logout, hasRole } = useAuth();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const location = useLocation();

  const isActive = (to: string) => (to === '/' ? location.pathname === '/' : location.pathname.startsWith(to));
  const initials = user?.fullName.split(' ').map((part) => part[0]).slice(0, 2).join('') ?? '?';

  return (
    <AppShell header={{ height: 60 }} navbar={{ width: 250, breakpoint: 'sm', collapsed: { mobile: !mobileOpened } }} padding="lg">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="sm" size="sm" />
            <ThemeIcon size={34} radius="md">
              <IconBuildingCommunity size={20} />
            </ThemeIcon>
            <Title order={4} visibleFrom="xs">
              CampusOps
            </Title>
          </Group>
          <Group gap="xs">
            <Tooltip label={colorScheme === 'dark' ? 'Light mode' : 'Dark mode'}>
              <ActionIcon variant="subtle" size="lg" onClick={toggleColorScheme} aria-label="Toggle colour scheme">
                {colorScheme === 'dark' ? <IconSun size={20} /> : <IconMoon size={20} />}
              </ActionIcon>
            </Tooltip>
            <NotificationBell />
            <Menu position="bottom-end" width={220}>
              <Menu.Target>
                <Group gap="xs" style={{ cursor: 'pointer' }}>
                  <Avatar color="blue" radius="xl" size={34}>
                    {initials}
                  </Avatar>
                  <Box visibleFrom="md">
                    <Text size="sm" fw={600} lh={1.2}>
                      {user?.fullName}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {user?.email}
                    </Text>
                  </Box>
                </Group>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>
                  <StatusBadge value={user?.role ?? 'STUDENT'} size="sm" />
                </Menu.Label>
                <Menu.Item leftSection={<IconKey size={16} />} onClick={() => setPasswordOpened(true)}>
                  Change password
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item color="red" leftSection={<IconLogout size={16} />} onClick={logout}>
                  Sign out
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        <ScrollArea>
          <Stack gap="md">
            {NAVIGATION.map((section, index) => {
              const items = section.items.filter((item) => hasRole(...item.roles));
              if (items.length === 0) return null;
              return (
                <Stack key={section.title ?? index} gap={2}>
                  {section.title && (
                    <Text size="xs" fw={700} c="dimmed" tt="uppercase" px="sm" mb={4}>
                      {section.title}
                    </Text>
                  )}
                  {items.map((item) => (
                    <NavLink key={item.to} component={Link} to={item.to} label={item.label} leftSection={item.icon} active={isActive(item.to)} onClick={closeMobile} style={{ borderRadius: 6 }} />
                  ))}
                </Stack>
              );
            })}
          </Stack>
        </ScrollArea>
      </AppShell.Navbar>

      <AppShell.Main bg={colorScheme === 'dark' ? undefined : 'var(--mantine-color-gray-0)'}>
        <Outlet />
      </AppShell.Main>
      <ChangePasswordModal opened={passwordOpened} onClose={() => setPasswordOpened(false)} />
    </AppShell>
  );
}
