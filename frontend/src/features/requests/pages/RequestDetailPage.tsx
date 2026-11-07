import { Alert, Anchor, Badge, Grid, Group, Paper, Rating, SimpleGrid, Stack, Table, Text, Title } from '@mantine/core';
import { IconAlertTriangle, IconArrowLeft } from '@tabler/icons-react';
import { Link, useParams } from 'react-router';
import { useAuth } from '@/auth/AuthContext';
import { RoleGroups } from '@/auth/roles';
import { AttachmentList } from '@/shared/components/AttachmentList';
import { DetailItem } from '@/shared/components/DetailItem';
import { FileUploadButton } from '@/shared/components/FileUploadButton';
import { QueryState } from '@/shared/components/QueryState';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { enumLabel } from '@/shared/utils/labels';
import { formatDateTime, formatRelative } from '@/shared/utils/format';
import { notify } from '@/shared/utils/notify';
import { requestsApi, useRequestDetail, useRequestMutation } from '../api';
import { RequestActions } from '../components/RequestActions';
import { RequestTimeline } from '../components/RequestTimeline';
import type { ServiceRequestDetail } from '../types';

export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const request = useRequestDetail(id);
  return (
    <>
      <Anchor component={Link} to="/requests" size="sm" mb="sm" display="inline-flex" style={{ alignItems: 'center', gap: 4 }}>
        <IconArrowLeft size={14} /> All requests
      </Anchor>
      <QueryState query={request}>{(data) => <RequestDetailView request={data} />}</QueryState>
    </>
  );
}

function RequestDetailView({ request }: { request: ServiceRequestDetail }) {
  const { hasRole } = useAuth();
  const isFieldStaff = hasRole(...RoleGroups.FIELD_STAFF);
  const upload = useRequestMutation((files: File[]) => requestsApi.upload(request.id, files));

  return (
    <Stack>
      <Paper withBorder radius="md" p="lg">
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <Stack gap={6}>
            <Group gap="xs">
              <Text c="dimmed" fw={600}>
                {request.code}
              </Text>
              <StatusBadge value={request.status} size="lg" />
              <StatusBadge value={request.priority} variant="filled" size="lg" />
              <StatusBadge value={request.slaState} variant="dot" size="lg" />
              {request.isEscalated && (
                <Badge color="red" variant="outline">
                  Escalated
                </Badge>
              )}
            </Group>
            <Title order={2}>{request.title}</Title>
            <Text size="sm" c="dimmed">
              Reported by {request.requester.fullName} {formatRelative(request.createdAt)}
            </Text>
          </Stack>
          <RequestActions request={request} />
        </Group>
        {request.isSafetyRelated && (
          <Alert color="red" icon={<IconAlertTriangle size={16} />} mt="md" variant="light">
            Safety-related request
          </Alert>
        )}
        {request.rejectionReason && (
          <Alert color="red" mt="md" title="Rejected">
            {request.rejectionReason}
          </Alert>
        )}
      </Paper>

      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack>
            <Paper withBorder radius="md" p="lg">
              <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="lg">
                <DetailItem label="Category">{enumLabel(request.category)}</DetailItem>
                <DetailItem label="Impact / urgency">
                  {enumLabel(request.severity)} / {enumLabel(request.urgency)}
                </DetailItem>
                <DetailItem label="Building">{request.building.name}</DetailItem>
                <DetailItem label="Room">{request.room ? `${request.room.code} – ${request.room.name}` : '—'}</DetailItem>
                <DetailItem label="Equipment">{request.asset ? `${request.asset.code} – ${request.asset.name}` : '—'}</DetailItem>
                <DetailItem label="Location details">{request.locationDetails ?? '—'}</DetailItem>
                <DetailItem label="Response due">{formatDateTime(request.responseDueAt)}</DetailItem>
                <DetailItem label="Resolution due">{formatDateTime(request.resolutionDueAt)}</DetailItem>
                <DetailItem label="Resolved">{formatDateTime(request.resolvedAt)}</DetailItem>
                <DetailItem label="Preferred contact">
                  {enumLabel(request.preferredContact)}
                  {request.contactDetail ? ` – ${request.contactDetail}` : ''}
                </DetailItem>
              </SimpleGrid>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600} mt="lg">
                Description
              </Text>
              <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                {request.description}
              </Text>
            </Paper>

            <Paper withBorder radius="md" p="lg">
              <Group justify="space-between" mb="sm">
                <Title order={5}>Photos & files</Title>
                {request.availableActions.includes('ADD_ATTACHMENTS') && (
                  <FileUploadButton
                    loading={upload.isPending}
                    onFiles={(files) => upload.mutate(files, { onSuccess: () => notify.success('Files uploaded'), onError: (error) => notify.error(error) })}
                  />
                )}
              </Group>
              <AttachmentList attachments={request.attachments} />
            </Paper>

            {request.workOrders.length > 0 && (
              <Paper withBorder radius="md" p="lg">
                <Title order={5} mb="sm">
                  Work orders
                </Title>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Code</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Technician</Table.Th>
                      <Table.Th>Due</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {request.workOrders.map((wo) => (
                      <Table.Tr key={wo.id}>
                        <Table.Td>
                          {isFieldStaff ? (
                            <Anchor component={Link} to={`/work-orders/${wo.id}`} fw={600}>
                              {wo.code}
                            </Anchor>
                          ) : (
                            wo.code
                          )}
                        </Table.Td>
                        <Table.Td>
                          <StatusBadge value={wo.status} />
                        </Table.Td>
                        <Table.Td>{wo.technician?.fullName ?? 'Not assigned'}</Table.Td>
                        <Table.Td>{formatDateTime(wo.dueAt)}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>
            )}

            {request.feedback && (
              <Paper withBorder radius="md" p="lg">
                <Title order={5} mb="sm">
                  Requester feedback
                </Title>
                <Group>
                  <Rating value={request.feedback.rating} readOnly />
                  <Text size="sm" c="dimmed">
                    {formatDateTime(request.feedback.createdAt)}
                  </Text>
                </Group>
                {request.feedback.comment && (
                  <Text size="sm" mt="xs">
                    “{request.feedback.comment}”
                  </Text>
                )}
              </Paper>
            )}
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper withBorder radius="md" p="lg">
            <Title order={5} mb="md">
              Progress
            </Title>
            <RequestTimeline history={request.history} />
          </Paper>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
