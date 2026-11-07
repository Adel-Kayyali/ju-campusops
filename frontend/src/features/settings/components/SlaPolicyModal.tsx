import { Button, Group, Modal, NumberInput, Stack, TextInput } from '@mantine/core';
import { useEffect, useState } from 'react';
import { notify } from '@/shared/utils/notify';
import { useUpdateSlaPolicy, type SlaPolicy } from '../api';

export function SlaPolicyModal({ policy, onClose }: { policy: SlaPolicy | null; onClose: () => void }) {
  const [responseHours, setResponseHours] = useState<number | ''>('');
  const [resolutionHours, setResolutionHours] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  useEffect(() => {
    if (policy) {
      setResponseHours(policy.responseHours);
      setResolutionHours(policy.resolutionHours);
      setDescription(policy.description ?? '');
    }
  }, [policy]);

  const update = useUpdateSlaPolicy();
  const valid = typeof responseHours === 'number' && typeof resolutionHours === 'number' && responseHours >= 1 && resolutionHours >= responseHours;

  return (
    <Modal opened={policy !== null} onClose={onClose} title={`Service-level targets – ${policy?.priority ?? ''}`} centered>
      <Stack>
        <NumberInput label="Response time (hours)" description="Time to acknowledge the request" min={1} max={720} value={responseHours} onChange={(v) => setResponseHours(typeof v === 'number' ? v : '')} />
        <NumberInput
          label="Resolution time (hours)"
          description="Time to resolve the request"
          min={1}
          max={2160}
          value={resolutionHours}
          onChange={(v) => setResolutionHours(typeof v === 'number' ? v : '')}
          error={typeof resolutionHours === 'number' && typeof responseHours === 'number' && resolutionHours < responseHours ? 'Must be at least the response time' : undefined}
        />
        <TextInput label="Description" value={description} onChange={(e) => setDescription(e.currentTarget.value)} />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!valid}
            loading={update.isPending}
            onClick={() =>
              update.mutate(
                { priority: policy!.priority, input: { responseHours: responseHours as number, resolutionHours: resolutionHours as number, description: description.trim() || undefined } },
                {
                  onSuccess: () => {
                    notify.success('New targets apply to requests submitted from now on', 'SLA updated');
                    onClose();
                  },
                  onError: notify.error,
                },
              )
            }
          >
            Save
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
