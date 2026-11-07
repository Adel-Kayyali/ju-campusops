import { ActionIcon, Button, Group, Menu, Paper, Select, SimpleGrid, Switch, Table, Text, TextInput } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconDots, IconEdit, IconKey, IconPlus, IconSearch } from '@tabler/icons-react';
import { useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { EmptyState } from '@/shared/components/EmptyState';
import { PageHeader } from '@/shared/components/PageHeader';
import { PaginationBar } from '@/shared/components/PaginationBar';
import { QueryState } from '@/shared/components/QueryState';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { ROLES, type Role } from '@/shared/types/enums';
import { toOptions } from '@/shared/utils/labels';
import { notify } from '@/shared/utils/notify';
import { usersApi, useUserMutation, useUsers, type User } from '../api';
import { ResetPasswordModal } from '../components/ResetPasswordModal';
import { UserFormModal } from '../components/UserFormModal';

/** Account administration: create users, change roles, deactivate, reset passwords. */
export function UsersPage() {
  const { user: me } = useAuth();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<Role | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const users = useUsers({ search: debouncedSearch, role: role ?? undefined, isActive: status === null ? undefined : status === 'active', page, size });

  const [editing, setEditing] = useState<User | null>(null);
  const [creating, setCreating] = useState(false);
  const [resetting, setResetting] = useState<User | null>(null);
  const setActive = useUserMutation(({ id, isActive }: { id: string; isActive: boolean }) => usersApi.setActive(id, isActive));

  return (
    <>
      <PageHeader
        title="Users"
        description="Students, staff, technicians, facility managers and administrators."
        actions={
          <Button leftSection={<IconPlus size={16} />} onClick={() => setCreating(true)}>
            New user
          </Button>
        }
      />
      <Paper withBorder p="md" radius="md" mb="md">
        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          <TextInput label="Search" placeholder="Name, email or university ID" leftSection={<IconSearch size={14} />} value={search} onChange={(e) => { setSearch(e.currentTarget.value); setPage(1); }} />
          <Select label="Role" placeholder="All roles" clearable data={toOptions(ROLES)} value={role} onChange={(v) => { setRole(v as Role | null); setPage(1); }} />
          <Select label="Status" placeholder="All" clearable data={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Deactivated' }]} value={status} onChange={(v) => { setStatus(v); setPage(1); }} />
        </SimpleGrid>
      </Paper>
      <Paper withBorder p="md" radius="md">
        <QueryState query={users}>
          {(data) =>
            data.content.length === 0 ? (
              <EmptyState title="No user found" />
            ) : (
              <>
                <Table.ScrollContainer minWidth={900}>
                  <Table striped highlightOnHover verticalSpacing="sm">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Name</Table.Th>
                        <Table.Th>Email</Table.Th>
                        <Table.Th>Role</Table.Th>
                        <Table.Th>University ID</Table.Th>
                        <Table.Th>Department</Table.Th>
                        <Table.Th>Active</Table.Th>
                        <Table.Th />
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {data.content.map((u) => (
                        <Table.Tr key={u.id}>
                          <Table.Td fw={600}>{u.fullName}</Table.Td>
                          <Table.Td>
                            <Text size="sm">{u.email}</Text>
                          </Table.Td>
                          <Table.Td>
                            <StatusBadge value={u.role} />
                          </Table.Td>
                          <Table.Td>{u.universityId ?? '—'}</Table.Td>
                          <Table.Td>{u.department ?? '—'}</Table.Td>
                          <Table.Td>
                            <Switch
                              checked={u.isActive}
                              disabled={u.id === me?.id}
                              aria-label="Active"
                              onChange={(e) =>
                                setActive.mutate(
                                  { id: u.id, isActive: e.currentTarget.checked },
                                  { onSuccess: (updated) => notify.success(`${updated.fullName} is now ${updated.isActive ? 'active' : 'deactivated'}`), onError: notify.error },
                                )
                              }
                            />
                          </Table.Td>
                          <Table.Td>
                            <Group justify="flex-end">
                              <Menu position="bottom-end">
                                <Menu.Target>
                                  <ActionIcon variant="subtle" aria-label="Actions">
                                    <IconDots size={16} />
                                  </ActionIcon>
                                </Menu.Target>
                                <Menu.Dropdown>
                                  <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => setEditing(u)}>
                                    Edit
                                  </Menu.Item>
                                  <Menu.Item leftSection={<IconKey size={14} />} onClick={() => setResetting(u)}>
                                    Reset password
                                  </Menu.Item>
                                </Menu.Dropdown>
                              </Menu>
                            </Group>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
                <PaginationBar page={data} onPageChange={setPage} onSizeChange={(s) => { setSize(s); setPage(1); }} />
              </>
            )
          }
        </QueryState>
      </Paper>
      <UserFormModal opened={creating || editing !== null} user={editing} onClose={() => { setCreating(false); setEditing(null); }} />
      <ResetPasswordModal user={resetting} onClose={() => setResetting(null)} />
    </>
  );
}
