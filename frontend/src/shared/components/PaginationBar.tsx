import { Group, Pagination, Select, Text } from '@mantine/core';
import type { Page } from '@/api/types';

interface PaginationBarProps {
  page: Page<unknown>;
  onPageChange: (page: number) => void;
  onSizeChange?: (size: number) => void;
  /** Page sizes offered in the selector. */
  sizeOptions?: number[];
}

export function PaginationBar({ page, onPageChange, onSizeChange, sizeOptions = [10, 20, 50, 100] }: PaginationBarProps) {
  const from = page.totalElements === 0 ? 0 : (page.page - 1) * page.size + 1;
  const to = Math.min(page.page * page.size, page.totalElements);
  return (
    <Group justify="space-between" mt="md" wrap="wrap">
      <Text size="sm" c="dimmed">
        Showing {from}–{to} of {page.totalElements}
      </Text>
      <Group gap="sm">
        {onSizeChange && (
          <Select
            size="xs"
            w={90}
            value={String(page.size)}
            data={sizeOptions.map(String)}
            onChange={(value) => value && onSizeChange(Number(value))}
            allowDeselect={false}
          />
        )}
        <Pagination size="sm" value={page.page} total={page.totalPages} onChange={onPageChange} />
      </Group>
    </Group>
  );
}
