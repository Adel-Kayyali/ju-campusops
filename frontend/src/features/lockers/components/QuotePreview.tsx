import { Alert, Group, Loader, Paper, Text } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import { errorMessage } from '@/api/apiError';
import { formatDate, formatMoney } from '@/shared/utils/format';
import type { Quote } from '../types';

interface QuotePreviewProps {
  quote: Quote | undefined;
  isFetching: boolean;
  error: unknown;
}

/** Live price preview calculated by the API (single source of truth for pricing). */
export function QuotePreview({ quote, isFetching, error }: QuotePreviewProps) {
  if (error) {
    return (
      <Alert color="red" icon={<IconAlertTriangle size={16} />}>
        {errorMessage(error)}
      </Alert>
    );
  }
  if (!quote) {
    return (
      <Text size="sm" c="dimmed">
        Choose the period to see the price.
      </Text>
    );
  }
  return (
    <>
      <Paper withBorder p="sm" radius="md" bg="var(--mantine-color-blue-light)">
        <Group justify="space-between">
          <div>
            <Text size="sm">
              {formatDate(quote.startDate)} → {formatDate(quote.endDate)} ({quote.days} days)
            </Text>
            <Text size="xs" c="dimmed">
              {quote.billableMonths} month(s) × {formatMoney(quote.monthlyFee)}
            </Text>
          </div>
          <Group gap="xs">
            {isFetching && <Loader size="xs" />}
            <Text fw={700} size="lg">
              {formatMoney(quote.amount)}
            </Text>
          </Group>
        </Group>
      </Paper>
      {quote.conflict && (
        <Alert color="orange" icon={<IconAlertTriangle size={16} />} mt="xs">
          This locker is already taken from {formatDate(quote.conflict.startDate)} to {formatDate(quote.conflict.endDate)}. Choose another period or locker.
        </Alert>
      )}
    </>
  );
}
