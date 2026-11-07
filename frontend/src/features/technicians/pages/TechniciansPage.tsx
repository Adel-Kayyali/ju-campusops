import { ActionIcon, Badge, Group, Paper, Progress, SimpleGrid, Stack, Text, Tooltip } from '@mantine/core';
import { IconEdit, IconMail, IconPhone } from '@tabler/icons-react';
import { useState } from 'react';
import { EmptyState } from '@/shared/components/EmptyState';
import { PageHeader } from '@/shared/components/PageHeader';
import { QueryState } from '@/shared/components/QueryState';
import { enumLabel } from '@/shared/utils/labels';
import { useTechnicians } from '../api';
import { TechnicianProfileModal } from '../components/TechnicianProfileModal';
import type { Technician } from '../types';

/** Maintenance team: skills, home building, availability and current workload. */
export function TechniciansPage() {
  const technicians = useTechnicians();
  const [editing, setEditing] = useState<Technician | null>(null);

  return (
    <>
      <PageHeader title="Technicians" description="Skills, location and workload used to suggest the best technician for each job." />
      <QueryState query={technicians}>
        {(list) =>
          list.length === 0 ? (
            <EmptyState title="No technicians yet" description="Create users with the Technician role first." />
          ) : (
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
              {list.map((t) => {
                const load = Math.min(100, (t.openWorkOrders / Math.max(1, t.maxOpenOrders)) * 100);
                return (
                  <Paper key={t.id} withBorder radius="md" p="md" opacity={t.isActive ? 1 : 0.6}>
                    <Stack gap="xs">
                      <Group justify="space-between">
                        <Text fw={700}>{t.fullName}</Text>
                        <Group gap="xs">
                          {!t.isActive && <Badge color="gray">Deactivated</Badge>}
                          <Badge color={t.isAvailable ? 'green' : 'red'} variant="light">
                            {t.isAvailable ? 'Available' : 'Unavailable'}
                          </Badge>
                          <Tooltip label="Edit profile">
                            <ActionIcon variant="subtle" onClick={() => setEditing(t)} aria-label="Edit profile">
                              <IconEdit size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Group>
                      <Group gap="md">
                        <Group gap={4}>
                          <IconMail size={14} />
                          <Text size="xs">{t.email}</Text>
                        </Group>
                        {t.phone && (
                          <Group gap={4}>
                            <IconPhone size={14} />
                            <Text size="xs">{t.phone}</Text>
                          </Group>
                        )}
                      </Group>
                      <Text size="sm" c="dimmed">
                        Home building: {t.homeBuilding ? `${t.homeBuilding.code} – ${t.homeBuilding.name}` : 'Not set'}
                      </Text>
                      <Group gap={4}>
                        {t.skills.length === 0 ? (
                          <Text size="xs" c="dimmed">
                            No skills recorded
                          </Text>
                        ) : (
                          t.skills.map((skill) => (
                            <Badge key={skill} size="sm" variant="outline">
                              {enumLabel(skill)}
                            </Badge>
                          ))
                        )}
                      </Group>
                      <div>
                        <Group justify="space-between">
                          <Text size="xs">Workload</Text>
                          <Text size="xs" fw={600}>
                            {t.openWorkOrders} / {t.maxOpenOrders} open orders
                          </Text>
                        </Group>
                        <Progress value={load} color={load >= 100 ? 'red' : load >= 70 ? 'orange' : 'blue'} size="sm" mt={4} />
                      </div>
                    </Stack>
                  </Paper>
                );
              })}
            </SimpleGrid>
          )
        }
      </QueryState>
      <TechnicianProfileModal technician={editing} onClose={() => setEditing(null)} />
    </>
  );
}
