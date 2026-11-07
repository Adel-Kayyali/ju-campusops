import { ActionIcon, Badge, Button, Group, Menu, Select, SimpleGrid, Switch, Table, Text, TextInput } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconAdjustments, IconDots, IconEdit, IconPlus, IconSearch } from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import { EmptyState } from '@/shared/components/EmptyState';
import { QueryState } from '@/shared/components/QueryState';
import { useInventoryItems } from '../api';
import type { InventoryItem } from '../types';
import { AdjustStockModal } from './AdjustStockModal';
import { ItemDetailDrawer } from './ItemDetailDrawer';
import { ItemFormModal } from './ItemFormModal';

export function ItemsTab({ isManager }: { isManager: boolean }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [debouncedSearch] = useDebouncedValue(search, 300);
  const items = useInventoryItems({ search: debouncedSearch, category: category ?? undefined, lowStockOnly });
  const allItems = useInventoryItems({});
  const categories = useMemo(() => [...new Set((allItems.data ?? []).map((i) => i.category))].sort(), [allItems.data]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [adjusting, setAdjusting] = useState<InventoryItem | null>(null);

  return (
    <>
      <Group justify="space-between" align="flex-end" mb="md" wrap="wrap">
        <SimpleGrid cols={{ base: 1, sm: 3 }} style={{ flex: 1 }}>
          <TextInput label="Search" placeholder="SKU or name" leftSection={<IconSearch size={14} />} value={search} onChange={(e) => setSearch(e.currentTarget.value)} />
          <Select label="Category" placeholder="All" clearable data={categories} value={category} onChange={setCategory} />
          <Switch label="Low stock / shortages only" mt={28} checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.currentTarget.checked)} />
        </SimpleGrid>
        {isManager && (
          <Button leftSection={<IconPlus size={16} />} onClick={() => setCreating(true)}>
            New item
          </Button>
        )}
      </Group>
      <QueryState query={items}>
        {(list) =>
          list.length === 0 ? (
            <EmptyState title="No item found" />
          ) : (
            <Table.ScrollContainer minWidth={1000}>
              <Table striped highlightOnHover verticalSpacing="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>SKU</Table.Th>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Category</Table.Th>
                    <Table.Th>On hand</Table.Th>
                    <Table.Th>Reserved</Table.Th>
                    <Table.Th>Available</Table.Th>
                    <Table.Th>Shortage</Table.Th>
                    <Table.Th>Reorder at</Table.Th>
                    <Table.Th>Location</Table.Th>
                    {isManager && <Table.Th />}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {list.map((item) => (
                    <Table.Tr key={item.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedId(item.id)}>
                      <Table.Td fw={600}>{item.sku}</Table.Td>
                      <Table.Td>
                        <Group gap={6}>
                          <Text size="sm">{item.name}</Text>
                          {item.isLowStock && (
                            <Badge size="xs" color="orange">
                              Low stock
                            </Badge>
                          )}
                        </Group>
                      </Table.Td>
                      <Table.Td>{item.category}</Table.Td>
                      <Table.Td>
                        {item.quantityOnHand} {item.unit}
                      </Table.Td>
                      <Table.Td>{item.reservedQuantity}</Table.Td>
                      <Table.Td fw={600}>{item.availableQuantity}</Table.Td>
                      <Table.Td>{item.shortageQuantity > 0 ? <Badge color="red">{item.shortageQuantity}</Badge> : '—'}</Table.Td>
                      <Table.Td>{item.reorderLevel}</Table.Td>
                      <Table.Td>
                        <Text size="xs">{item.storageLocation ?? '—'}</Text>
                      </Table.Td>
                      {isManager && (
                        <Table.Td onClick={(e) => e.stopPropagation()}>
                          <Menu position="bottom-end">
                            <Menu.Target>
                              <ActionIcon variant="subtle" aria-label="Actions">
                                <IconDots size={16} />
                              </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                              <Menu.Item leftSection={<IconAdjustments size={14} />} onClick={() => setAdjusting(item)}>
                                Adjust stock
                              </Menu.Item>
                              <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => setEditing(item)}>
                                Edit
                              </Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        </Table.Td>
                      )}
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          )
        }
      </QueryState>
      <ItemDetailDrawer itemId={selectedId} onClose={() => setSelectedId(null)} />
      <ItemFormModal opened={creating || editing !== null} item={editing} onClose={() => { setCreating(false); setEditing(null); }} />
      <AdjustStockModal item={adjusting} onClose={() => setAdjusting(null)} />
    </>
  );
}
