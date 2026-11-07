import { Alert, Anchor, Grid, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconAlertTriangle, IconArrowLeft, IconClockExclamation } from '@tabler/icons-react';
import { Link, useParams } from 'react-router';
import { AttachmentList } from '@/shared/components/AttachmentList';
import { DetailItem } from '@/shared/components/DetailItem';
import { FileUploadButton } from '@/shared/components/FileUploadButton';
import { QueryState } from '@/shared/components/QueryState';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { enumLabel } from '@/shared/utils/labels';
import { formatDateTime } from '@/shared/utils/format';
import { notify } from '@/shared/utils/notify';
import { useWorkOrderDetail, useWorkOrderMutation, workOrdersApi } from '../api';
import { MaterialsPanel } from '../components/MaterialsPanel';
import { TaskList } from '../components/TaskList';
import { WorkOrderActions } from '../components/WorkOrderActions';
import type { WorkOrderDetail } from '../types';

export function WorkOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const workOrder = useWorkOrderDetail(id);
  return (
    <>
      <Anchor component={Link} to="/work-orders" size="sm" mb="sm" display="inline-flex" style={{ alignItems: 'center', gap: 4 }}>
        <IconArrowLeft size={14} /> All work orders
      </Anchor>
      <QueryState query={workOrder}>{(data) => <WorkOrderView workOrder={data} />}</QueryState>
    </>
  );
}

function WorkOrderView({ workOrder }: { workOrder: WorkOrderDetail }) {
  const upload = useWorkOrderMutation((files: File[]) => workOrdersApi.uploadEvidence(workOrder.id, files));

  return (
    <Stack>
      <Paper withBorder radius="md" p="lg">
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <Stack gap={6}>
            <Group gap="xs">
              <Text c="dimmed" fw={600}>
                {workOrder.code}
              </Text>
              <StatusBadge value={workOrder.status} size="lg" />
              <StatusBadge value={workOrder.priority} variant="filled" size="lg" />
              <StatusBadge value={workOrder.type} label={enumLabel(workOrder.type)} variant="outline" size="lg" />
            </Group>
            <Title order={2}>{workOrder.title}</Title>
          </Stack>
          <WorkOrderActions workOrder={workOrder} />
        </Group>
        {workOrder.isBlocked && (
          <Alert color="red" icon={<IconAlertTriangle size={16} />} mt="md" title="Waiting for spare parts">
            The repair cannot start until the missing parts are received. A procurement request is waiting for approval in Inventory.
          </Alert>
        )}
        {workOrder.isOverdue && (
          <Alert color="orange" icon={<IconClockExclamation size={16} />} mt="md">
            This work order is past its due date ({formatDateTime(workOrder.dueAt)}).
          </Alert>
        )}
      </Paper>

      <Grid>
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Stack>
            <Paper withBorder radius="md" p="lg">
              <Title order={5} mb="md">
                Tasks
              </Title>
              <TaskList workOrder={workOrder} />
            </Paper>
            <Paper withBorder radius="md" p="lg">
              <Title order={5} mb="md">
                Spare parts
              </Title>
              <MaterialsPanel workOrder={workOrder} />
            </Paper>
          </Stack>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Stack>
            <Paper withBorder radius="md" p="lg">
              <SimpleGrid cols={2} spacing="lg">
                <DetailItem label="Technician">{workOrder.technician?.fullName ?? <Text size="sm" c="orange">Not assigned</Text>}</DetailItem>
                <DetailItem label="Due">{formatDateTime(workOrder.dueAt)}</DetailItem>
                <DetailItem label="Service request">
                  {workOrder.request ? (
                    <Anchor component={Link} to={`/requests/${workOrder.request.id}`} size="sm">
                      {workOrder.request.code}
                    </Anchor>
                  ) : (
                    '—'
                  )}
                </DetailItem>
                <DetailItem label="Requester">{workOrder.requester?.fullName ?? '—'}</DetailItem>
                <DetailItem label="Asset">
                  {workOrder.asset ? (
                    <Anchor component={Link} to={`/assets/${workOrder.asset.id}`} size="sm">
                      {workOrder.asset.code} – {workOrder.asset.name}
                    </Anchor>
                  ) : (
                    '—'
                  )}
                </DetailItem>
                <DetailItem label="Location">{[workOrder.building?.name, workOrder.room?.name].filter(Boolean).join(' • ') || '—'}</DetailItem>
                <DetailItem label="Schedule">{workOrder.schedule?.title ?? '—'}</DetailItem>
                <DetailItem label="Created by">{workOrder.createdBy ?? 'System'}</DetailItem>
                <DetailItem label="Started">{formatDateTime(workOrder.startedAt)}</DetailItem>
                <DetailItem label="Completed">{formatDateTime(workOrder.completedAt)}</DetailItem>
                <DetailItem label="Verified">{formatDateTime(workOrder.verifiedAt)}</DetailItem>
              </SimpleGrid>
              {workOrder.description && (
                <>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600} mt="lg">
                    Description
                  </Text>
                  <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                    {workOrder.description}
                  </Text>
                </>
              )}
              {workOrder.repairNotes && (
                <>
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600} mt="lg">
                    Repair notes
                  </Text>
                  <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                    {workOrder.repairNotes}
                  </Text>
                </>
              )}
            </Paper>
            <Paper withBorder radius="md" p="lg">
              <Group justify="space-between" mb="sm">
                <Title order={5}>Evidence</Title>
                {workOrder.availableActions.includes('ADD_EVIDENCE') && (
                  <FileUploadButton loading={upload.isPending} onFiles={(files) => upload.mutate(files, { onSuccess: () => notify.success('Evidence uploaded'), onError: (error) => notify.error(error) })} />
                )}
              </Group>
              <AttachmentList attachments={workOrder.attachments} />
            </Paper>
          </Stack>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
