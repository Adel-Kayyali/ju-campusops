import { Group, Paper, Text, ThemeIcon, type MantineColor } from '@mantine/core';
import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  color?: MantineColor;
  hint?: ReactNode;
  onClick?: () => void;
}

export function StatCard({ label, value, icon, color = 'blue', hint, onClick }: StatCardProps) {
  return (
    <Paper withBorder radius="md" p="md" style={{ cursor: onClick ? 'pointer' : undefined }} onClick={onClick}>
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <div>
          <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
            {label}
          </Text>
          <Text fw={700} fz={26} lh={1.2} mt={4}>
            {value}
          </Text>
          {hint && (
            <Text size="xs" c="dimmed" mt={4}>
              {hint}
            </Text>
          )}
        </div>
        <ThemeIcon size={40} radius="md" variant="light" color={color}>
          {icon}
        </ThemeIcon>
      </Group>
    </Paper>
  );
}
