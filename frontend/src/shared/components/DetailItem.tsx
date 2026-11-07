import { Stack, Text } from '@mantine/core';
import type { ReactNode } from 'react';

/** A label / value pair used on detail pages. */
export function DetailItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Stack gap={2}>
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
        {label}
      </Text>
      <div style={{ fontSize: 'var(--mantine-font-size-sm)' }}>{children ?? '—'}</div>
    </Stack>
  );
}
