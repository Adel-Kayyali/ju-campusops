import { Alert, SimpleGrid, Stack, Title } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import { EmptyState } from '@/shared/components/EmptyState';
import { PageHeader } from '@/shared/components/PageHeader';
import { QueryState } from '@/shared/components/QueryState';
import { useMyLockers } from '../api';
import { SubscriptionCard } from '../components/SubscriptionCard';

/** The student's own lockers (read-only). */
export function MyLockersPage() {
  const lockers = useMyLockers();
  return (
    <>
      <PageHeader title="My lockers" description="Your locker subscriptions and cash receipts." />
      <Alert icon={<IconInfoCircle size={18} />} mb="lg" variant="light">
        To rent, extend or return a locker, visit the facilities office. Payment is in cash; keep your receipt number.
      </Alert>
      <QueryState query={lockers}>
        {(subscriptions) => {
          const live = subscriptions.filter((s) => s.status === 'ACTIVE');
          const past = subscriptions.filter((s) => s.status !== 'ACTIVE');
          if (subscriptions.length === 0) {
            return <EmptyState title="You have no locker yet" description="Visit the facilities office to rent one." />;
          }
          return (
            <Stack gap="lg">
              <Title order={4}>Current lockers ({live.length})</Title>
              {live.length === 0 ? (
                <EmptyState title="No active locker" />
              ) : (
                <SimpleGrid cols={{ base: 1, md: 2 }}>
                  {live.map((s) => (
                    <SubscriptionCard key={s.id} subscription={s} />
                  ))}
                </SimpleGrid>
              )}
              {past.length > 0 && (
                <>
                  <Title order={4}>History</Title>
                  <SimpleGrid cols={{ base: 1, md: 2 }}>
                    {past.map((s) => (
                      <SubscriptionCard key={s.id} subscription={s} />
                    ))}
                  </SimpleGrid>
                </>
              )}
            </Stack>
          );
        }}
      </QueryState>
    </>
  );
}
