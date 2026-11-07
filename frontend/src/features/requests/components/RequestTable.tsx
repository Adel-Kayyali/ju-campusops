import { Group, Table, Text, Tooltip } from '@mantine/core';
import { IconAlertTriangle, IconPaperclip } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { enumLabel } from '@/shared/utils/labels';
import { formatDateTime, formatRelative } from '@/shared/utils/format';
import type { ServiceRequest } from '../types';

export function RequestTable({ requests }: { requests: ServiceRequest[] }) {
  const navigate = useNavigate();
  return (
    <Table.ScrollContainer minWidth={1000}>
      <Table striped highlightOnHover verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Code</Table.Th>
            <Table.Th>Title</Table.Th>
            <Table.Th>Category</Table.Th>
            <Table.Th>Priority</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>SLA</Table.Th>
            <Table.Th>Location</Table.Th>
            <Table.Th>Requester</Table.Th>
            <Table.Th>Created</Table.Th>
            <Table.Th>Due</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {requests.map((request) => (
            <Table.Tr key={request.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/requests/${request.id}`)}>
              <Table.Td fw={600}>{request.code}</Table.Td>
              <Table.Td maw={260}>
                <Group gap={6} wrap="nowrap">
                  {request.isSafetyRelated && (
                    <Tooltip label="Safety related">
                      <IconAlertTriangle size={16} color="var(--mantine-color-red-6)" />
                    </Tooltip>
                  )}
                  <Text size="sm" lineClamp={1}>
                    {request.title}
                  </Text>
                  {request.attachmentCount > 0 && <IconPaperclip size={14} color="var(--mantine-color-dimmed)" />}
                </Group>
              </Table.Td>
              <Table.Td>{enumLabel(request.category)}</Table.Td>
              <Table.Td>
                <StatusBadge value={request.priority} variant="filled" />
              </Table.Td>
              <Table.Td>
                <StatusBadge value={request.status} />
              </Table.Td>
              <Table.Td>
                <Group gap={4} wrap="nowrap">
                  <StatusBadge value={request.slaState} variant="dot" />
                  {request.isEscalated && <StatusBadge value="BREACHED" label="Escalated" size="xs" variant="outline" />}
                </Group>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{request.building.code}</Text>
                <Text size="xs" c="dimmed">
                  {request.room?.name ?? request.asset?.name ?? ''}
                </Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{request.requester.fullName}</Text>
              </Table.Td>
              <Table.Td>
                <Tooltip label={formatDateTime(request.createdAt)}>
                  <Text size="sm">{formatRelative(request.createdAt)}</Text>
                </Tooltip>
              </Table.Td>
              <Table.Td>
                <Text size="sm" c={request.slaState === 'BREACHED' ? 'red' : undefined}>
                  {formatDateTime(request.resolutionDueAt)}
                </Text>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
