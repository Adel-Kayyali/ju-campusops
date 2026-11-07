import { Anchor, Button, Grid, Group, Paper, SimpleGrid, Stack, Table, Text, Title } from '@mantine/core';
import { IconAlarm, IconCircleCheck, IconClipboardList, IconLock, IconMessageReport, IconPlus } from '@tabler/icons-react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '@/auth/AuthContext';
import { EmptyState } from '@/shared/components/EmptyState';
import { QueryState } from '@/shared/components/QueryState';
import { StatCard } from '@/shared/components/StatCard';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { formatDateTime } from '@/shared/utils/format';
import { usePersonalOverview } from '../api';
import type { PersonalOverview } from '../types';
import { RecentRequestsTable } from './RecentRequestsTable';

/** Dashboard of students, staff members and technicians. */
export function PersonalDashboard() {
  const overview = usePersonalOverview();
  return <QueryState query={overview}>{(data) => <PersonalContent data={data} />}</QueryState>;
}

function PersonalContent({ data }: { data: PersonalOverview }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isTechnician = user?.role === 'TECHNICIAN';
  const isStudent = user?.role === 'STUDENT';

  return (
    <Stack gap="lg">
      {!isTechnician && (
        <Paper withBorder radius="md" p="lg" bg="var(--mantine-color-blue-light)">
          <Group justify="space-between" wrap="wrap">
            <div>
              <Title order={4}>Something broken on campus?</Title>
              <Text size="sm" c="dimmed">
                Report it in a minute and follow the repair step by step.
              </Text>
            </div>
            <Button size="md" component={Link} to="/requests/new" leftSection={<IconPlus size={18} />}>
              Report a problem
            </Button>
          </Group>
        </Paper>
      )}

      <SimpleGrid cols={{ base: 1, xs: 2, md: isTechnician ? 4 : 3 }}>
        {isTechnician && (
          <>
            <StatCard label="My active work orders" value={data.activeWorkOrders} icon={<IconClipboardList size={22} />} color="indigo" onClick={() => navigate('/work-orders')} />
            <StatCard label="Overdue" value={data.overdueWorkOrders} icon={<IconAlarm size={22} />} color="red" onClick={() => navigate('/work-orders')} />
          </>
        )}
        <StatCard label="My open requests" value={data.openRequests} icon={<IconMessageReport size={22} />} onClick={() => navigate('/requests')} />
        <StatCard
          label="Waiting for my confirmation"
          value={data.resolvedAwaitingConfirmation}
          icon={<IconCircleCheck size={22} />}
          color="teal"
          hint={data.resolvedAwaitingConfirmation > 0 ? 'Please confirm the repairs' : undefined}
          onClick={() => navigate('/requests')}
        />
        {isStudent && <StatCard label="My active lockers" value={data.activeLockers} icon={<IconLock size={22} />} color="grape" hint="View details" onClick={() => navigate('/my-lockers')} />}
      </SimpleGrid>

      <Grid>
        {isTechnician && (
          <Grid.Col span={{ base: 12, lg: 7 }}>
            <Paper withBorder radius="md" p="md">
              <Group justify="space-between" mb="sm">
                <Title order={5}>My work orders</Title>
                <Anchor component={Link} to="/work-orders" size="sm">
                  View all
                </Anchor>
              </Group>
              {data.myWorkOrders.length === 0 ? (
                <EmptyState title="No active job" description="New assignments will appear here." />
              ) : (
                <Table verticalSpacing="xs" highlightOnHover>
                  <Table.Tbody>
                    {data.myWorkOrders.map((wo) => {
                      const overdue = new Date(wo.dueAt) < new Date();
                      return (
                        <Table.Tr key={wo.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/work-orders/${wo.id}`)}>
                          <Table.Td fw={600}>{wo.code}</Table.Td>
                          <Table.Td>
                            <Text size="sm" lineClamp={1}>
                              {wo.title}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <StatusBadge value={wo.priority} variant="filled" size="sm" />
                          </Table.Td>
                          <Table.Td>
                            <StatusBadge value={wo.status} size="sm" />
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs" c={overdue ? 'red' : 'dimmed'} fw={overdue ? 600 : undefined}>
                              Due {formatDateTime(wo.dueAt)}
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              )}
            </Paper>
          </Grid.Col>
        )}
        <Grid.Col span={{ base: 12, lg: isTechnician ? 5 : 12 }}>
          <Paper withBorder radius="md" p="md">
            <Group justify="space-between" mb="sm">
              <Title order={5}>My recent requests</Title>
              <Anchor component={Link} to="/requests" size="sm">
                View all
              </Anchor>
            </Group>
            <RecentRequestsTable requests={data.recentRequests} />
          </Paper>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
