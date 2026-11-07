import { Button, Divider, Group, Modal, NumberInput, Select, SimpleGrid, Stack, Text, Textarea, TextInput } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { StudentPicker } from '@/features/users/StudentPicker';
import { todayDateOnly } from '@/shared/utils/format';
import { notify } from '@/shared/utils/notify';
import { lockersApi, useLockerMutation, useQuote } from '../api';
import type { Locker } from '../types';
import { PeriodSelector, toPeriodInput, type PeriodValue } from './PeriodSelector';
import { QuotePreview } from './QuotePreview';

interface StartSubscriptionModalProps {
  locker: Locker | null;
  onClose: () => void;
}

const initialPeriod = (): PeriodValue => ({ mode: 'preset', startDate: todayDateOnly(), months: 1, range: [null, null] });

/** Rents a locker to a student and records the cash payment. */
export function StartSubscriptionModal({ locker, onClose }: StartSubscriptionModalProps) {
  const [studentId, setStudentId] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodValue>(initialPeriod);
  const [amountOverride, setAmountOverride] = useState<number | ''>('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (locker) {
      setStudentId(null);
      setPeriod(initialPeriod());
      setAmountOverride('');
      setReceiptNumber('');
      setNotes('');
    }
  }, [locker]);

  const periodInput = toPeriodInput(period);
  const quoteInput = useMemo(() => (locker && periodInput ? { lockerId: locker.id, ...periodInput } : null), [locker, periodInput?.startDate, periodInput?.durationMonths, periodInput?.endDate]); // eslint-disable-line react-hooks/exhaustive-deps
  const quote = useQuote(quoteInput);

  const start = useLockerMutation(lockersApi.start);
  const canSubmit = Boolean(locker && studentId && periodInput && quote.data && !quote.data.conflict && !quote.isError);

  const submit = () => {
    if (!locker || !studentId || !periodInput) return;
    start.mutate(
      {
        lockerId: locker.id,
        studentId,
        ...periodInput,
        paymentMethod: 'CASH',
        amountOverride: amountOverride === '' ? undefined : amountOverride,
        receiptNumber: receiptNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: (subscription) => {
          notify.success(`Locker ${subscription.locker.code} assigned to ${subscription.student.fullName}. Receipt ${subscription.payments[0]?.receiptNumber}.`, 'Subscription started');
          onClose();
        },
        onError: (error) => notify.error(error),
      },
    );
  };

  return (
    <Modal opened={locker !== null} onClose={onClose} title={<Text fw={700}>Start subscription – locker {locker?.code}</Text>} size="lg" centered>
      <Stack>
        <StudentPicker value={studentId} onChange={setStudentId} />
        <PeriodSelector value={period} onChange={setPeriod} />
        <QuotePreview quote={quote.data} isFetching={quote.isFetching} error={quote.error} />

        <Divider label="Payment" labelPosition="left" />
        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          <Select label="Method" data={[{ value: 'CASH', label: 'Cash' }]} value="CASH" readOnly />
          <NumberInput label="Amount received (JOD)" description="Leave empty to use the price" min={0} decimalScale={2} value={amountOverride} onChange={(v) => setAmountOverride(typeof v === 'number' ? v : '')} />
          <TextInput label="Receipt number" description="Generated if empty" value={receiptNumber} onChange={(e) => setReceiptNumber(e.currentTarget.value)} />
        </SimpleGrid>
        <Textarea label="Notes" autosize minRows={2} value={notes} onChange={(e) => setNotes(e.currentTarget.value)} />

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={start.isPending} disabled={!canSubmit}>
            Confirm & record payment
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
