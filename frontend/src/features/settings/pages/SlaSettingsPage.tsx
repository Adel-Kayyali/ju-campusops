import { ActionIcon, Alert, Paper, SimpleGrid, Table, Text, Title } from '@mantine/core';
import { IconEdit, IconInfoCircle } from '@tabler/icons-react';
import { useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { PageHeader } from '@/shared/components/PageHeader';
import { QueryState } from '@/shared/components/QueryState';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { SEVERITIES, URGENCIES } from '@/shared/types/enums';
import { enumLabel } from '@/shared/utils/labels';
import { useSlaPolicies, type SlaPolicy } from '../api';
import { SlaPolicyModal } from '../components/SlaPolicyModal';
import { PRIORITY_MATRIX } from '../priorityMatrix';

/** Service-level targets per priority, and how a request's priority is calculated. */
export function SlaSettingsPage() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('ADMIN');
  const policies = useSlaPolicies();
  const [editing, setEditing] = useState<SlaPolicy | null>(null);

  return (
    <>
      <PageHeader title="Service-level settings" description="Response and resolution targets used to compute due dates and escalate late requests." />
      {!isAdmin && (
        <Alert icon={<IconInfoCircle size={18} />} mb="md" variant="light">
          Only the system administrator can change these targets.
        </Alert>
      )}
      <SimpleGrid cols={{ base: 1, lg: 2 }}>
        <Paper withBorder radius="md" p="md">
          <Title order={4} mb="sm">
            Targets per priority
          </Title>
          <QueryState query={policies}>
            {(list) => (
              <Table striped verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Priority</Table.Th>
                    <Table.Th>Response</Table.Th>
                    <Table.Th>Resolution</Table.Th>
                    <Table.Th>Meaning</Table.Th>
                    {isAdmin && <Table.Th />}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {list.map((policy) => (
                    <Table.Tr key={policy.priority}>
                      <Table.Td>
                        <StatusBadge value={policy.priority} variant="filled" />
                      </Table.Td>
                      <Table.Td>{policy.responseHours} h</Table.Td>
                      <Table.Td>{policy.resolutionHours} h</Table.Td>
                      <Table.Td>
                        <Text size="sm">{policy.description ?? '—'}</Text>
                      </Table.Td>
                      {isAdmin && (
                        <Table.Td>
                          <ActionIcon variant="subtle" onClick={() => setEditing(policy)} aria-label="Edit">
                            <IconEdit size={16} />
                          </ActionIcon>
                        </Table.Td>
                      )}
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </QueryState>
        </Paper>

        <Paper withBorder radius="md" p="md">
          <Title order={4} mb={4}>
            Priority matrix
          </Title>
          <Text size="sm" c="dimmed" mb="sm">
            The priority of a request is calculated from its impact (severity) and urgency. Safety-related requests are never lower than P2.
          </Text>
          <Table withColumnBorders verticalSpacing="sm" ta="center">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Impact \ Urgency</Table.Th>
                {URGENCIES.map((u) => (
                  <Table.Th key={u} ta="center">
                    {enumLabel(u)}
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {[...SEVERITIES].reverse().map((severity) => (
                <Table.Tr key={severity}>
                  <Table.Td fw={600} ta="left">
                    {enumLabel(severity)}
                  </Table.Td>
                  {URGENCIES.map((urgency) => (
                    <Table.Td key={urgency}>
                      <StatusBadge value={PRIORITY_MATRIX[severity][urgency]} />
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      </SimpleGrid>
      <SlaPolicyModal policy={editing} onClose={() => setEditing(null)} />
    </>
  );
}
