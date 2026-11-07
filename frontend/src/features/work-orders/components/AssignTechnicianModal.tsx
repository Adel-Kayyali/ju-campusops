import { Button, Group, Modal, Select, Stack } from '@mantine/core';
import { useEffect, useState } from 'react';
import { notify } from '@/shared/utils/notify';
import { useTechnicianOptions, useWorkOrderMutation, workOrdersApi } from '../api';
import type { WorkOrderDetail } from '../types';

export function AssignTechnicianModal({ workOrder, opened, onClose }: { workOrder: WorkOrderDetail; opened: boolean; onClose: () => void }) {
  const technicians = useTechnicianOptions(opened);
  const [technicianId, setTechnicianId] = useState<string | null>(null);
  useEffect(() => {
    if (opened) setTechnicianId(workOrder.technician?.id ?? null);
  }, [opened, workOrder.technician?.id]);

  const assign = useWorkOrderMutation((id: string) => workOrdersApi.assign(workOrder.id, id));
  const options = (technicians.data ?? [])
    .filter((t) => t.isActive)
    .map((t) => ({
      value: t.id,
      label: `${t.fullName} – ${t.openWorkOrders}/${t.maxOpenOrders} open${t.isAvailable ? '' : ' (unavailable)'}`,
    }));

  return (
    <Modal opened={opened} onClose={onClose} title={`Assign ${workOrder.code}`} centered>
      <Stack>
        <Select label="Technician" searchable data={options} value={technicianId} onChange={setTechnicianId} />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!technicianId || technicianId === workOrder.technician?.id}
            loading={assign.isPending}
            onClick={() =>
              assign.mutate(technicianId!, {
                onSuccess: (updated) => {
                  notify.success(`Assigned to ${updated.technician?.fullName}`);
                  onClose();
                },
                onError: (error) => notify.error(error),
              })
            }
          >
            Assign
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
