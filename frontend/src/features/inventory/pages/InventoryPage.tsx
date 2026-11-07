import { Badge, Paper, Tabs } from '@mantine/core';
import { IconAlertTriangle, IconBox, IconShoppingCart } from '@tabler/icons-react';
import { useSearchParams } from 'react-router';
import { useAuth } from '@/auth/AuthContext';
import { RoleGroups } from '@/auth/roles';
import { PageHeader } from '@/shared/components/PageHeader';
import { useShortages } from '../api';
import { ItemsTab } from '../components/ItemsTab';
import { ProcurementTab } from '../components/ProcurementTab';
import { ShortagesTab } from '../components/ShortagesTab';

const TABS = ['items', 'shortages', 'procurement'] as const;
type Tab = (typeof TABS)[number];

/** Spare parts, shortages blocking work orders, and purchase requests. The tab is kept in the URL (?tab=). */
export function InventoryPage() {
  const { hasRole } = useAuth();
  const isManager = hasRole(...RoleGroups.MANAGEMENT);
  const [params, setParams] = useSearchParams();
  const tab: Tab = TABS.includes(params.get('tab') as Tab) ? (params.get('tab') as Tab) : 'items';
  const shortages = useShortages();
  const shortageCount = shortages.data?.length ?? 0;

  return (
    <>
      <PageHeader title="Inventory" description="Stock levels, reserved parts, shortages and procurement approvals." />
      <Paper withBorder radius="md" p="md">
        <Tabs value={tab} onChange={(value) => setParams(value && value !== 'items' ? { tab: value } : {})} keepMounted={false}>
          <Tabs.List mb="md">
            <Tabs.Tab value="items" leftSection={<IconBox size={16} />}>
              Items
            </Tabs.Tab>
            <Tabs.Tab value="shortages" leftSection={<IconAlertTriangle size={16} />} rightSection={shortageCount > 0 ? <Badge size="xs" color="red">{shortageCount}</Badge> : undefined}>
              Shortages
            </Tabs.Tab>
            <Tabs.Tab value="procurement" leftSection={<IconShoppingCart size={16} />}>
              Procurement
            </Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="items">
            <ItemsTab isManager={isManager} />
          </Tabs.Panel>
          <Tabs.Panel value="shortages">
            <ShortagesTab />
          </Tabs.Panel>
          <Tabs.Panel value="procurement">
            <ProcurementTab isManager={isManager} />
          </Tabs.Panel>
        </Tabs>
      </Paper>
    </>
  );
}
