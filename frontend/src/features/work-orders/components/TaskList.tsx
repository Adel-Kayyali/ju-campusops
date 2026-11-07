import { Badge, Button, Group, Paper, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconCheck, IconLock, IconPlayerPlay, IconPlayerSkipForward } from '@tabler/icons-react';
import { useState } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { RoleGroups } from '@/auth/roles';
import { ReasonModal } from '@/shared/components/ReasonModal';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { formatDateTime } from '@/shared/utils/format';
import { notify } from '@/shared/utils/notify';
import { workOrdersApi, useWorkOrderMutation } from '../api';
import type { WorkOrderDetail, WorkOrderTask } from '../types';
import { TaskNotesModal } from './TaskNotesModal';

const FINISHED = ['DONE', 'SKIPPED'];

/**
 * The dependent tasks of a work order. Buttons are offered for open tasks;
 * the API enforces dependencies and permissions and its message is shown on refusal.
 */
export function TaskList({ workOrder }: { workOrder: WorkOrderDetail }) {
  const { user, hasRole } = useAuth();
  const isManager = hasRole(...RoleGroups.MANAGEMENT);
  const isAssigned = workOrder.technician?.id === user?.id;
  const isActive = workOrder.status === 'OPEN' || workOrder.status === 'IN_PROGRESS';
  const [completing, setCompleting] = useState<WorkOrderTask | null>(null);
  const [skipping, setSkipping] = useState<WorkOrderTask | null>(null);

  const start = useWorkOrderMutation((taskId: string) => workOrdersApi.startTask(workOrder.id, taskId));
  const complete = useWorkOrderMutation(({ taskId, notes }: { taskId: string; notes?: string }) => workOrdersApi.completeTask(workOrder.id, taskId, notes));
  const skip = useWorkOrderMutation(({ taskId, reason }: { taskId: string; reason: string }) => workOrdersApi.skipTask(workOrder.id, taskId, reason));

  const canAct = (task: WorkOrderTask) => {
    if (!isActive || FINISHED.includes(task.status) || task.type === 'REQUESTER_CONFIRMATION') return false;
    return task.type === 'MATERIAL_APPROVAL' ? isManager : isManager || isAssigned;
  };

  return (
    <Stack gap="sm">
      {workOrder.tasks.map((task) => {
        const finished = FINISHED.includes(task.status);
        return (
          <Paper key={task.id} withBorder radius="md" p="sm" style={{ opacity: !task.isUnlocked && !finished ? 0.75 : 1 }}>
            <Group justify="space-between" wrap="nowrap" align="flex-start">
              <Group wrap="nowrap" align="flex-start">
                <ThemeIcon radius="xl" size={30} color={finished ? 'green' : task.isUnlocked ? 'blue' : 'gray'} variant={finished ? 'filled' : 'light'}>
                  {finished ? <IconCheck size={16} /> : !task.isUnlocked ? <IconLock size={14} /> : <Text size="sm" fw={700}>{task.sequence}</Text>}
                </ThemeIcon>
                <div>
                  <Group gap="xs">
                    <Text fw={600} size="sm">
                      #{task.sequence} {task.title}
                    </Text>
                    <StatusBadge value={task.status} size="sm" />
                    {task.dependsOn.length > 0 && (
                      <Badge size="sm" variant="outline" color="gray">
                        Depends on {task.dependsOn.map((n) => `#${n}`).join(', ')}
                      </Badge>
                    )}
                  </Group>
                  {task.type === 'REQUESTER_CONFIRMATION' && !finished && (
                    <Text size="xs" c="dimmed">
                      Completed automatically when the requester confirms the repair.
                    </Text>
                  )}
                  {task.notes && (
                    <Text size="sm" mt={4}>
                      {task.notes}
                    </Text>
                  )}
                  {task.completedAt && (
                    <Text size="xs" c="dimmed" mt={2}>
                      {task.status === 'SKIPPED' ? 'Skipped' : 'Done'} by {task.completedBy} • {formatDateTime(task.completedAt)}
                    </Text>
                  )}
                </div>
              </Group>
              {canAct(task) && (
                <Group gap="xs" wrap="nowrap">
                  {task.status === 'PENDING' && task.type !== 'MATERIAL_APPROVAL' && (
                    <Button
                      size="xs"
                      variant="light"
                      leftSection={<IconPlayerPlay size={14} />}
                      disabled={!task.isUnlocked}
                      loading={start.isPending && start.variables === task.id}
                      onClick={() => start.mutate(task.id, { onSuccess: () => notify.success('Task started'), onError: (error) => notify.error(error) })}
                    >
                      Start
                    </Button>
                  )}
                  {task.type === 'MATERIAL_APPROVAL' && (
                    <Button size="xs" variant="subtle" color="gray" leftSection={<IconPlayerSkipForward size={14} />} disabled={!task.isUnlocked} onClick={() => setSkipping(task)}>
                      Not needed
                    </Button>
                  )}
                  <Button size="xs" color="green" leftSection={<IconCheck size={14} />} disabled={!task.isUnlocked} onClick={() => setCompleting(task)}>
                    {task.type === 'MATERIAL_APPROVAL' ? 'Approve' : 'Complete'}
                  </Button>
                </Group>
              )}
            </Group>
          </Paper>
        );
      })}

      <TaskNotesModal
        task={completing}
        loading={complete.isPending}
        onClose={() => setCompleting(null)}
        onConfirm={(notes) =>
          complete.mutate(
            { taskId: completing!.id, notes: notes || undefined },
            {
              onSuccess: (updated) => {
                notify.success(updated.status === 'COMPLETED' ? 'Work completed – the requester has been notified' : 'Task completed');
                setCompleting(null);
              },
              onError: (error) => notify.error(error),
            },
          )
        }
      />
      <ReasonModal
        opened={skipping !== null}
        title="Skip material approval"
        description="Use this when the repair does not need any approved materials."
        confirmLabel="Skip step"
        loading={skip.isPending}
        onClose={() => setSkipping(null)}
        onConfirm={(reason) =>
          skip.mutate(
            { taskId: skipping!.id, reason },
            {
              onSuccess: () => {
                notify.success('Step skipped');
                setSkipping(null);
              },
              onError: (error) => notify.error(error),
            },
          )
        }
      />
    </Stack>
  );
}
