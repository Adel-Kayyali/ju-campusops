import { Button, Group, Modal, MultiSelect, NumberInput, Select, Stack, Switch } from '@mantine/core';
import { useEffect, useState } from 'react';
import { buildingOptions, useBuildings } from '@/features/locations/api';
import { REQUEST_CATEGORIES, type RequestCategory } from '@/shared/types/enums';
import { toOptions } from '@/shared/utils/labels';
import { notify } from '@/shared/utils/notify';
import { useUpdateTechnicianProfile } from '../api';
import type { Technician } from '../types';

/** Edits skills, home building, availability and capacity of a technician. */
export function TechnicianProfileModal({ technician, onClose }: { technician: Technician | null; onClose: () => void }) {
  const buildings = useBuildings();
  const update = useUpdateTechnicianProfile();
  const [skills, setSkills] = useState<RequestCategory[]>([]);
  const [homeBuildingId, setHomeBuildingId] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [maxOpenOrders, setMaxOpenOrders] = useState<number>(5);

  useEffect(() => {
    if (technician) {
      setSkills(technician.skills);
      setHomeBuildingId(technician.homeBuilding?.id ?? null);
      setIsAvailable(technician.isAvailable);
      setMaxOpenOrders(technician.maxOpenOrders);
    }
  }, [technician]);

  const save = () =>
    update.mutate(
      { id: technician!.id, input: { skills, homeBuildingId, isAvailable, maxOpenOrders } },
      {
        onSuccess: () => {
          notify.success('Technician profile updated');
          onClose();
        },
        onError: notify.error,
      },
    );

  return (
    <Modal opened={technician !== null} onClose={onClose} title={`Profile – ${technician?.fullName ?? ''}`} centered>
      <Stack>
        <MultiSelect label="Skills" data={toOptions(REQUEST_CATEGORIES)} value={skills} onChange={(v) => setSkills(v as RequestCategory[])} searchable clearable />
        <Select label="Home building" data={buildingOptions(buildings.data)} value={homeBuildingId} onChange={setHomeBuildingId} clearable />
        <NumberInput label="Maximum open work orders" min={1} max={30} value={maxOpenOrders} onChange={(v) => setMaxOpenOrders(typeof v === 'number' ? v : 5)} />
        <Switch label="Available for new work" checked={isAvailable} onChange={(e) => setIsAvailable(e.currentTarget.checked)} />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} loading={update.isPending}>
            Save
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
