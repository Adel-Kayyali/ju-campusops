import { Anchor, Button, Group, List, Modal, Stack, Text } from '@mantine/core';
import { Link } from 'react-router';
import type { GenerationResult } from '../types';

export function GenerationResultModal({ result, onClose }: { result: GenerationResult | null; onClose: () => void }) {
  return (
    <Modal opened={result !== null} onClose={onClose} title="Preventive work generated" centered>
      <Stack>
        {result?.generated === 0 ? (
          <Text size="sm">No schedule is due right now. Work orders are created automatically every day when a schedule enters its lead time.</Text>
        ) : (
          <>
            <Text size="sm">{result?.generated} work order(s) were created:</Text>
            <List size="sm">
              {result?.workOrders.map((wo) => (
                <List.Item key={wo.id}>
                  <Anchor component={Link} to={`/work-orders/${wo.id}`} onClick={onClose} fw={600}>
                    {wo.code}
                  </Anchor>{' '}
                  – {wo.title}
                </List.Item>
              ))}
            </List>
          </>
        )}
        <Group justify="flex-end">
          <Button onClick={onClose}>Close</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
