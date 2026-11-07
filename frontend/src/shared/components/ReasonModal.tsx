import { Button, Group, Modal, Stack, Text, Textarea } from '@mantine/core';
import { useEffect, useState } from 'react';

interface ReasonModalProps {
  opened: boolean;
  title: string;
  description?: string;
  label?: string;
  confirmLabel?: string;
  confirmColor?: string;
  required?: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

/** Generic "are you sure? + reason / note" dialog. */
export function ReasonModal({ opened, title, description, label = 'Reason', confirmLabel = 'Confirm', confirmColor, required = true, loading, onClose, onConfirm }: ReasonModalProps) {
  const [reason, setReason] = useState('');
  useEffect(() => {
    if (opened) setReason('');
  }, [opened]);

  return (
    <Modal opened={opened} onClose={onClose} title={title} centered>
      <Stack>
        {description && <Text size="sm">{description}</Text>}
        <Textarea label={label} autosize minRows={3} value={reason} onChange={(e) => setReason(e.currentTarget.value)} required={required} data-autofocus />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button color={confirmColor} loading={loading} disabled={required && reason.trim().length === 0} onClick={() => onConfirm(reason.trim())}>
            {confirmLabel}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
