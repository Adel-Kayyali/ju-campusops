import { Button, Group, Modal, Stack, Text, Textarea } from '@mantine/core';
import { useEffect, useState } from 'react';
import { NOTES_REQUIRED_TASKS, type WorkOrderTask } from '../types';

interface TaskNotesModalProps {
  task: WorkOrderTask | null;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (notes: string) => void;
}

/** Completes a task. Repair / preventive checks must describe the work done. */
export function TaskNotesModal({ task, loading, onClose, onConfirm }: TaskNotesModalProps) {
  const [notes, setNotes] = useState('');
  useEffect(() => {
    if (task) setNotes('');
  }, [task]);
  const required = task ? NOTES_REQUIRED_TASKS.includes(task.type) : false;

  return (
    <Modal opened={task !== null} onClose={onClose} title={`Complete: #${task?.sequence} ${task?.title ?? ''}`} centered>
      <Stack>
        {required && <Text size="sm">Describe what was done. These repair notes are shown to the requester.</Text>}
        <Textarea label={required ? 'Repair notes' : 'Notes (optional)'} required={required} autosize minRows={3} value={notes} onChange={(e) => setNotes(e.currentTarget.value)} data-autofocus />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button color="green" loading={loading} disabled={required && notes.trim().length === 0} onClick={() => onConfirm(notes.trim())}>
            Mark as done
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
