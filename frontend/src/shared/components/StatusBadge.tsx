import { Badge, type BadgeProps } from '@mantine/core';
import { enumLabel, statusColor } from '@/shared/utils/labels';

interface StatusBadgeProps extends Omit<BadgeProps, 'children' | 'color'> {
  value: string;
  label?: string;
}

/** Coloured badge for any enum value (statuses, priorities, roles ...). */
export function StatusBadge({ value, label, variant = 'light', ...props }: StatusBadgeProps) {
  return (
    <Badge color={statusColor(value)} variant={variant} {...props}>
      {label ?? enumLabel(value)}
    </Badge>
  );
}
