import { Button, Group, Modal, NumberInput, SegmentedControl, Select, SimpleGrid, Stack, Text, TextInput } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { formatDate } from '@/shared/utils/format';
import { notify } from '@/shared/utils/notify';
import { lockersApi, useLockerMutation, useQuote } from '../api';
import { PRESET_DURATIONS, type Subscription } from '../types';
import { QuotePreview } from './QuotePreview';

/** Adds time after the current end date (the extra period is paid in cash). */
export function ExtendSubscriptionModal({ subscription, onClose }: { subscription: Subscription | null; onClose: () => void }) {
  const [mode, setMode] = useState<'preset' | 'custom'>('preset');
  const [months, setMonths] = useState<number>(1);
  const [newEndDate, setNewEndDate] = useState<string | null>(null);
  const [amountOverride, setAmountOverride] = useState<number | ''>('');
  const [receiptNumber, setReceiptNumber] = useState('');

  useEffect(() => {
    if (subscription) {
      setMode('preset');
      setMonths(1);
      setNewEndDate(null);
      setAmountOverride('');
      setReceiptNumber('');
    }
  }, [subscription]);

  const extensionStart = subscription ? dayjs(subscription.endDate).add(1, 'day').format('YYYY-MM-DD') : '';
  const quoteInput = !subscription
    ? null
    : mode === 'preset'
      ? { lockerId: subscription.locker.id, startDate: extensionStart, durationMonths: months }
      : newEndDate
        ? { lockerId: subscription.locker.id, startDate: extensionStart, endDate: newEndDate }
        : null;
  const quote = useQuote(quoteInput);
  // The current subscription itself never conflicts with its own extension, but another one may.
  const conflict = quote.data?.conflict && quote.data.conflict.subscriptionId !== subscription?.id ? quote.data.conflict : null;
  const extend = useLockerMutation((input: Parameters<typeof lockersApi.extend>[1]) => lockersApi.extend(subscription!.id, input));

  const submit = () =>
    extend.mutate(
      {
        durationMonths: mode === 'preset' ? months : undefined,
        newEndDate: mode === 'custom' ? (newEndDate ?? undefined) : undefined,
        amountOverride: amountOverride === '' ? undefined : amountOverride,
        receiptNumber: receiptNumber.trim() || undefined,
      },
      {
        onSuccess: (updated) => {
          notify.success(`New end date: ${formatDate(updated.endDate)}`, 'Subscription extended');
          onClose();
        },
        onError: (error) => notify.error(error),
      },
    );

  return (
    <Modal opened={subscription !== null} onClose={onClose} title={<Text fw={700}>Extend locker {subscription?.locker.code}</Text>} centered size="lg">
      <Stack>
        <Text size="sm">
          {subscription?.student.fullName} – currently ends on <b>{formatDate(subscription?.endDate)}</b>. The extension starts on {formatDate(extensionStart)}.
        </Text>
        <SegmentedControl fullWidth value={mode} onChange={(v) => setMode(v as 'preset' | 'custom')} data={[{ value: 'preset', label: 'Add months' }, { value: 'custom', label: 'New end date' }]} />
        {mode === 'preset' ? (
          <Select label="Add" allowDeselect={false} data={PRESET_DURATIONS.map((m) => ({ value: String(m), label: `${m} month${m > 1 ? 's' : ''}` }))} value={String(months)} onChange={(v) => setMonths(Number(v))} />
        ) : (
          <DateInput label="New end date" valueFormat="DD MMM YYYY" minDate={extensionStart} value={newEndDate} onChange={setNewEndDate} />
        )}
        <QuotePreview quote={quote.data ? { ...quote.data, conflict } : undefined} isFetching={quote.isFetching} error={quote.error} />
        <SimpleGrid cols={2}>
          <NumberInput label="Amount received (JOD)" description="Leave empty to use the price" min={0} decimalScale={2} value={amountOverride} onChange={(v) => setAmountOverride(typeof v === 'number' ? v : '')} />
          <TextInput label="Receipt number" description="Generated if empty" value={receiptNumber} onChange={(e) => setReceiptNumber(e.currentTarget.value)} />
        </SimpleGrid>
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={extend.isPending} disabled={!quote.data || Boolean(conflict) || quote.isError}>
            Extend & record payment
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
