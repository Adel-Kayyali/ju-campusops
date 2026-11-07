import { Button, Group, Modal, Rating, Stack, Text, Textarea } from '@mantine/core';
import { useEffect, useState } from 'react';

interface ConfirmResolutionModalProps {
  opened: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (rating: number, comment?: string) => void;
}

/** The requester confirms the repair and rates the service (1-5 stars). */
export function ConfirmResolutionModal({ opened, loading, onClose, onConfirm }: ConfirmResolutionModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  useEffect(() => {
    if (opened) {
      setRating(0);
      setComment('');
    }
  }, [opened]);

  return (
    <Modal opened={opened} onClose={onClose} title="Confirm the repair" centered>
      <Stack>
        <Text size="sm">Is the problem fixed? Please rate the service you received.</Text>
        <Group justify="center">
          <Rating value={rating} onChange={setRating} size="xl" />
        </Group>
        <Textarea label="Comment (optional)" autosize minRows={2} value={comment} onChange={(e) => setComment(e.currentTarget.value)} />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button color="green" disabled={rating === 0} loading={loading} onClick={() => onConfirm(rating, comment.trim() || undefined)}>
            Confirm & close request
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
