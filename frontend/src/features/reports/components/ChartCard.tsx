import { Paper, Text } from '@mantine/core';
import type { ReactNode } from 'react';

export function ChartCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Paper withBorder radius="md" p="md">
      <Text fw={600}>{title}</Text>
      {description && (
        <Text size="xs" c="dimmed" mb="sm">
          {description}
        </Text>
      )}
      {children}
    </Paper>
  );
}
