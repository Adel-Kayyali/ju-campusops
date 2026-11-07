import { Alert, Button, Divider, Drawer, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconCalendarPlus, IconCircleX, IconEdit, IconPlayerPlay, IconTool } from '@tabler/icons-react';
import { useState } from 'react';
import { DetailItem } from '@/shared/components/DetailItem';
import { QueryState } from '@/shared/components/QueryState';
import { ReasonModal } from '@/shared/components/ReasonModal';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { enumLabel } from '@/shared/utils/labels';
import { formatMoney } from '@/shared/utils/format';
import { notify } from '@/shared/utils/notify';
import { lockersApi, useLockerDetail, useLockerMutation } from '../api';
import type { Locker, Subscription } from '../types';
import { ExtendSubscriptionModal } from './ExtendSubscriptionModal';
import { LockerFormModal } from './LockerFormModal';
import { SubscriptionCard } from './SubscriptionCard';

interface LockerDetailDrawerProps {
  lockerId: string | null;
  onClose: () => void;
  onStart: (locker: Locker) => void;
}

/** Side panel with everything about one locker: status, actions and full subscription history. */
export function LockerDetailDrawer({ lockerId, onClose, onStart }: LockerDetailDrawerProps) {
  const detail = useLockerDetail(lockerId);
  const [ending, setEnding] = useState<Subscription | null>(null);
  const [extending, setExtending] = useState<Subscription | null>(null);
  const [editing, setEditing] = useState(false);
  const [serviceDialog, setServiceDialog] = useState(false);

  const end = useLockerMutation(({ id, reason }: { id: string; reason: string }) => lockersApi.end(id, reason));
  const setService = useLockerMutation(({ id, outOfService, note }: { id: string; outOfService: boolean; note?: string }) => lockersApi.setServiceStatus(id, outOfService, note));

  return (
    <Drawer opened={lockerId !== null} onClose={onClose} position="right" size="xl" title={<Text fw={700} size="lg">Locker details</Text>}>
      <QueryState query={detail}>
        {({ locker, history }) => {
          const live = history.filter((s) => s.status === 'ACTIVE');
          return (
            <Stack>
              <Group justify="space-between">
                <Group gap="sm">
                  <Title order={3}>{locker.code}</Title>
                  <StatusBadge value={locker.status} size="lg" />
                </Group>
                <Group gap="xs">
                  <Button size="xs" variant="default" leftSection={<IconEdit size={14} />} onClick={() => setEditing(true)}>
                    Edit
                  </Button>
                  <Button
                    size="xs"
                    variant="light"
                    color={locker.isOutOfService ? 'green' : 'dark'}
                    leftSection={<IconTool size={14} />}
                    onClick={() =>
                      locker.isOutOfService
                        ? setService.mutate({ id: locker.id, outOfService: false }, { onSuccess: () => notify.success('Locker is back in service'), onError: (error) => notify.error(error) })
                        : setServiceDialog(true)
                    }
                  >
                    {locker.isOutOfService ? 'Back in service' : 'Mark out of service'}
                  </Button>
                </Group>
              </Group>
              {locker.isOutOfService && (
                <Alert color="dark" title="Out of service">
                  {locker.outOfServiceNote ?? 'No note'}
                </Alert>
              )}
              <SimpleGrid cols={{ base: 2, sm: 4 }}>
                <DetailItem label="Building">{locker.building.name}</DetailItem>
                <DetailItem label="Floor / zone">
                  {locker.floor} / {locker.zone}
                </DetailItem>
                <DetailItem label="Size">{enumLabel(locker.size)}</DetailItem>
                <DetailItem label="Monthly fee">{formatMoney(locker.monthlyFee)}</DetailItem>
              </SimpleGrid>
              <Button leftSection={<IconPlayerPlay size={16} />} disabled={locker.isOutOfService} onClick={() => onStart(locker)}>
                Start a new subscription
              </Button>

              <Divider label={`Current & upcoming (${live.length})`} labelPosition="left" />
              {live.length === 0 && (
                <Text size="sm" c="dimmed">
                  This locker is free.
                </Text>
              )}
              {live.map((subscription) => (
                <SubscriptionCard
                  key={subscription.id}
                  subscription={subscription}
                  showStudent
                  actions={
                    <Group gap="xs">
                      <Button size="xs" variant="light" leftSection={<IconCalendarPlus size={14} />} onClick={() => setExtending(subscription)}>
                        Extend
                      </Button>
                      <Button size="xs" variant="light" color="red" leftSection={<IconCircleX size={14} />} onClick={() => setEnding(subscription)}>
                        {subscription.state === 'UPCOMING' ? 'Cancel' : 'End'}
                      </Button>
                    </Group>
                  }
                />
              ))}

              <Divider label={`History (${history.length - live.length})`} labelPosition="left" />
              {history
                .filter((s) => s.status !== 'ACTIVE')
                .map((subscription) => (
                  <SubscriptionCard key={subscription.id} subscription={subscription} showStudent />
                ))}

              <ReasonModal
                opened={ending !== null}
                title={`End subscription of ${ending?.student.fullName}`}
                description="The locker is released immediately. The student is notified."
                confirmLabel="End subscription"
                confirmColor="red"
                loading={end.isPending}
                onClose={() => setEnding(null)}
                onConfirm={(reason) =>
                  end.mutate(
                    { id: ending!.id, reason },
                    {
                      onSuccess: () => {
                        notify.success('Subscription ended – the locker is free');
                        setEnding(null);
                      },
                      onError: (error) => notify.error(error),
                    },
                  )
                }
              />
              <ReasonModal
                opened={serviceDialog}
                title={`Mark ${locker.code} out of service`}
                label="What is wrong?"
                confirmLabel="Mark out of service"
                confirmColor="dark"
                required={false}
                loading={setService.isPending}
                onClose={() => setServiceDialog(false)}
                onConfirm={(note) =>
                  setService.mutate(
                    { id: locker.id, outOfService: true, note: note || undefined },
                    {
                      onSuccess: () => {
                        notify.success('Locker marked out of service');
                        setServiceDialog(false);
                      },
                      onError: (error) => notify.error(error),
                    },
                  )
                }
              />
              <ExtendSubscriptionModal subscription={extending} onClose={() => setExtending(null)} />
              <LockerFormModal opened={editing} locker={locker} onClose={() => setEditing(false)} />
            </Stack>
          );
        }}
      </QueryState>
    </Drawer>
  );
}
