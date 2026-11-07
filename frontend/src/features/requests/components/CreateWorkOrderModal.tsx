import { Alert, Badge, Button, Group, Loader, Modal, Paper, Radio, ScrollArea, Stack, Switch, Text } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { IconInfoCircle } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { notify } from '@/shared/utils/notify';
import { requestsApi, useRequestMutation, useTechnicianSuggestions } from '../api';
import type { ServiceRequestDetail } from '../types';

interface CreateWorkOrderModalProps {
  request: ServiceRequestDetail;
  opened: boolean;
  onClose: () => void;
}

/** Dispatches a request: creates a work order and (optionally) assigns a suggested technician. */
export function CreateWorkOrderModal({ request, opened, onClose }: CreateWorkOrderModalProps) {
  const navigate = useNavigate();
  const suggestions = useTechnicianSuggestions(request.category, request.building.id, opened);
  const [technicianId, setTechnicianId] = useState<string | null>(null);
  const [requiresMaterialApproval, setRequiresMaterialApproval] = useState(false);
  const [dueAt, setDueAt] = useState<string | null>(null);

  useEffect(() => {
    if (opened) {
      setRequiresMaterialApproval(false);
      setDueAt(null);
      setTechnicianId(null);
    }
  }, [opened]);

  useEffect(() => {
    const recommended = suggestions.data?.find((s) => s.isRecommended);
    if (opened && recommended && technicianId === null) setTechnicianId(recommended.userId);
  }, [opened, suggestions.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const create = useRequestMutation(requestsApi.createWorkOrder);

  const submit = () =>
    create.mutate(
      {
        requestId: request.id,
        technicianId: technicianId ?? undefined,
        requiresMaterialApproval,
        dueAt: dueAt ? dayjs(dueAt).toISOString() : undefined,
      },
      {
        onSuccess: (workOrder) => {
          notify.success(`Work order ${workOrder.code} created`);
          onClose();
          navigate(`/work-orders/${workOrder.id}`);
        },
        onError: (error) => notify.error(error),
      },
    );

  return (
    <Modal opened={opened} onClose={onClose} title={<Text fw={700}>Create work order for {request.code}</Text>} size="lg" centered>
      <Stack>
        <Text size="sm" fw={600}>
          Suggested technicians
        </Text>
        <Alert variant="light" icon={<IconInfoCircle size={16} />} p="xs">
          Ranked by matching skill, home building and current workload. You make the final choice.
        </Alert>
        {suggestions.isLoading ? (
          <Loader size="sm" />
        ) : (
          <ScrollArea.Autosize mah={300}>
            <Radio.Group value={technicianId ?? ''} onChange={(v) => setTechnicianId(v || null)}>
              <Stack gap="xs">
                <Radio value="" label="Do not assign yet" />
                {(suggestions.data ?? []).map((s) => (
                  <Paper key={s.userId} withBorder p="xs" radius="sm">
                    <Radio
                      value={s.userId}
                      label={
                        <Group gap="xs">
                          <Text size="sm" fw={600}>
                            {s.fullName}
                          </Text>
                          <Badge size="sm" variant="light" color={s.score >= 70 ? 'green' : s.score > 0 ? 'yellow' : 'gray'}>
                            Score {s.score}
                          </Badge>
                          {s.isRecommended && (
                            <Badge size="sm" color="green">
                              Recommended
                            </Badge>
                          )}
                        </Group>
                      }
                      description={s.reasons.join(' • ')}
                      disabled={s.score === 0}
                    />
                  </Paper>
                ))}
              </Stack>
            </Radio.Group>
          </ScrollArea.Autosize>
        )}
        <Switch label="Requires material approval before the repair" checked={requiresMaterialApproval} onChange={(e) => setRequiresMaterialApproval(e.currentTarget.checked)} />
        <DateTimePicker
          label="Due date (optional)"
          description="Defaults to the request's SLA deadline"
          clearable
          valueFormat="DD MMM YYYY HH:mm"
          minDate={dayjs().format('YYYY-MM-DD')}
          value={dueAt}
          onChange={setDueAt}
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={create.isPending}>
            Create work order
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
