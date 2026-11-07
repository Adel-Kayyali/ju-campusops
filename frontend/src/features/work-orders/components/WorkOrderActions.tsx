import { Button, Group } from '@mantine/core';
import { IconCircleX, IconRosetteDiscountCheck, IconUserShare } from '@tabler/icons-react';
import { useState } from 'react';
import { ReasonModal } from '@/shared/components/ReasonModal';
import { notify } from '@/shared/utils/notify';
import { useWorkOrderMutation, workOrdersApi } from '../api';
import type { WorkOrderDetail } from '../types';
import { AssignTechnicianModal } from './AssignTechnicianModal';

/** Work-order level buttons, decided by the API's availableActions. */
export function WorkOrderActions({ workOrder }: { workOrder: WorkOrderDetail }) {
  const [dialog, setDialog] = useState<'assign' | 'cancel' | null>(null);
  const can = (action: WorkOrderDetail['availableActions'][number]) => workOrder.availableActions.includes(action);
  const cancel = useWorkOrderMutation((reason: string) => workOrdersApi.cancel(workOrder.id, reason));
  const verify = useWorkOrderMutation(() => workOrdersApi.verify(workOrder.id));

  return (
    <>
      <Group gap="xs">
        {can('VERIFY') && (
          <Button color="green" leftSection={<IconRosetteDiscountCheck size={16} />} loading={verify.isPending} onClick={() => verify.mutate(undefined, { onSuccess: () => notify.success('Work verified'), onError: (error) => notify.error(error) })}>
            Verify work
          </Button>
        )}
        {can('ASSIGN') && (
          <Button variant="light" leftSection={<IconUserShare size={16} />} onClick={() => setDialog('assign')}>
            {workOrder.technician ? 'Reassign' : 'Assign technician'}
          </Button>
        )}
        {can('CANCEL') && (
          <Button variant="light" color="red" leftSection={<IconCircleX size={16} />} onClick={() => setDialog('cancel')}>
            Cancel
          </Button>
        )}
      </Group>
      <AssignTechnicianModal workOrder={workOrder} opened={dialog === 'assign'} onClose={() => setDialog(null)} />
      <ReasonModal
        opened={dialog === 'cancel'}
        title={`Cancel ${workOrder.code}`}
        description="Reserved parts are released and the request goes back to the coordinator's queue."
        confirmLabel="Cancel work order"
        confirmColor="red"
        loading={cancel.isPending}
        onClose={() => setDialog(null)}
        onConfirm={(reason) =>
          cancel.mutate(reason, {
            onSuccess: () => {
              notify.success('Work order cancelled');
              setDialog(null);
            },
            onError: (error) => notify.error(error),
          })
        }
      />
    </>
  );
}
