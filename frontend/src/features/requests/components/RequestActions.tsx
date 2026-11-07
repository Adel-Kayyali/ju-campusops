import { Button, Group } from '@mantine/core';
import { IconCheck, IconClipboardPlus, IconEye, IconLock, IconRefresh, IconX } from '@tabler/icons-react';
import { useState } from 'react';
import { ReasonModal } from '@/shared/components/ReasonModal';
import { notify } from '@/shared/utils/notify';
import { requestsApi, useRequestMutation } from '../api';
import type { ServiceRequestDetail } from '../types';
import { ConfirmResolutionModal } from './ConfirmResolutionModal';
import { CreateWorkOrderModal } from './CreateWorkOrderModal';

type Dialog = 'acknowledge' | 'reject' | 'close' | 'reopen' | 'confirm' | 'workOrder' | null;

/** The buttons shown on a request, decided by the API's availableActions. */
export function RequestActions({ request }: { request: ServiceRequestDetail }) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const can = (action: ServiceRequestDetail['availableActions'][number]) => request.availableActions.includes(action);
  const close = () => setDialog(null);
  const done = (message: string) => ({
    onSuccess: () => {
      notify.success(message);
      close();
    },
    onError: (error: unknown) => notify.error(error),
  });

  const acknowledge = useRequestMutation((note: string) => requestsApi.acknowledge(request.id, note || undefined));
  const reject = useRequestMutation((reason: string) => requestsApi.reject(request.id, reason));
  const closeRequest = useRequestMutation((note: string) => requestsApi.close(request.id, note || undefined));
  const reopen = useRequestMutation((reason: string) => requestsApi.reopen(request.id, reason));
  const confirm = useRequestMutation(({ rating, comment }: { rating: number; comment?: string }) => requestsApi.confirm(request.id, rating, comment));

  return (
    <>
      <Group gap="xs">
        {can('ACKNOWLEDGE') && (
          <Button variant="light" leftSection={<IconEye size={16} />} onClick={() => setDialog('acknowledge')}>
            Acknowledge
          </Button>
        )}
        {can('CREATE_WORK_ORDER') && (
          <Button leftSection={<IconClipboardPlus size={16} />} onClick={() => setDialog('workOrder')}>
            Create work order
          </Button>
        )}
        {can('CONFIRM_RESOLUTION') && (
          <Button color="green" leftSection={<IconCheck size={16} />} onClick={() => setDialog('confirm')}>
            Confirm repair
          </Button>
        )}
        {can('REOPEN') && (
          <Button variant="light" color="orange" leftSection={<IconRefresh size={16} />} onClick={() => setDialog('reopen')}>
            Still not fixed
          </Button>
        )}
        {can('CLOSE') && (
          <Button variant="light" color="gray" leftSection={<IconLock size={16} />} onClick={() => setDialog('close')}>
            Close
          </Button>
        )}
        {can('REJECT') && (
          <Button variant="light" color="red" leftSection={<IconX size={16} />} onClick={() => setDialog('reject')}>
            Reject
          </Button>
        )}
      </Group>

      <ReasonModal
        opened={dialog === 'acknowledge'}
        title={`Acknowledge ${request.code}`}
        description="The requester is told that the facilities team has reviewed the request."
        label="Note (optional)"
        required={false}
        confirmLabel="Acknowledge"
        loading={acknowledge.isPending}
        onClose={close}
        onConfirm={(note) => acknowledge.mutate(note, done('Request acknowledged'))}
      />
      <ReasonModal
        opened={dialog === 'reject'}
        title={`Reject ${request.code}`}
        description="The requester will see this reason."
        confirmLabel="Reject request"
        confirmColor="red"
        loading={reject.isPending}
        onClose={close}
        onConfirm={(reason) => reject.mutate(reason, done('Request rejected'))}
      />
      <ReasonModal
        opened={dialog === 'close'}
        title={`Close ${request.code}`}
        description="Close the resolved request without the requester's confirmation."
        label="Note (optional)"
        required={false}
        confirmLabel="Close request"
        loading={closeRequest.isPending}
        onClose={close}
        onConfirm={(note) => closeRequest.mutate(note, done('Request closed'))}
      />
      <ReasonModal
        opened={dialog === 'reopen'}
        title="The problem is not fixed"
        description="The work goes back to the technician."
        label="What is still wrong?"
        confirmLabel="Re-open request"
        confirmColor="orange"
        loading={reopen.isPending}
        onClose={close}
        onConfirm={(reason) => reopen.mutate(reason, done('Request re-opened'))}
      />
      <ConfirmResolutionModal
        opened={dialog === 'confirm'}
        loading={confirm.isPending}
        onClose={close}
        onConfirm={(rating, comment) => confirm.mutate({ rating, comment }, done('Thank you for your feedback!'))}
      />
      <CreateWorkOrderModal request={request} opened={dialog === 'workOrder'} onClose={close} />
    </>
  );
}
