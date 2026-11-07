import type { MantineColor } from '@mantine/core';

/** "IN_PROGRESS" -> "In progress", "IT_NETWORK" -> "IT network", "P1" -> "P1". */
export function enumLabel(value: string | null | undefined): string {
  if (!value) return '';
  if (/^P\d$/.test(value)) return value;
  const SPECIAL: Record<string, string> = { IT_NETWORK: 'IT & network', HVAC: 'HVAC', HVAC_UNIT: 'HVAC unit', IN_APP: 'In-app', FACILITY_MANAGER: 'Facility manager' };
  if (SPECIAL[value]) return SPECIAL[value];
  const text = value.toLowerCase().replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function toOptions<T extends string>(values: readonly T[], label: (value: T) => string = enumLabel): { value: T; label: string }[] {
  return values.map((value) => ({ value, label: label(value) }));
}

/** One colour per status value, used by every <StatusBadge>. */
const COLORS: Record<string, MantineColor> = {
  // generic / requests
  SUBMITTED: 'blue',
  ACKNOWLEDGED: 'cyan',
  ASSIGNED: 'indigo',
  IN_PROGRESS: 'yellow',
  RESOLVED: 'teal',
  VERIFIED: 'green',
  CLOSED: 'gray',
  REJECTED: 'red',
  // work orders & tasks
  OPEN: 'blue',
  COMPLETED: 'teal',
  CANCELLED: 'gray',
  PENDING: 'gray',
  DONE: 'green',
  SKIPPED: 'gray',
  // priorities & severities
  P1: 'red',
  P2: 'orange',
  P3: 'yellow',
  P4: 'gray',
  LOW: 'gray',
  MEDIUM: 'yellow',
  HIGH: 'orange',
  CRITICAL: 'red',
  // SLA
  ON_TRACK: 'green',
  AT_RISK: 'yellow',
  BREACHED: 'red',
  MET: 'green',
  MISSED: 'red',
  // lockers
  AVAILABLE: 'green',
  RESERVED: 'grape',
  OCCUPIED: 'blue',
  EXPIRING_SOON: 'orange',
  EXPIRED: 'red',
  OUT_OF_SERVICE: 'dark',
  UPCOMING: 'grape',
  ACTIVE: 'blue',
  ENDED: 'gray',
  // assets & inventory
  OPERATIONAL: 'green',
  UNDER_MAINTENANCE: 'yellow',
  RETIRED: 'gray',
  NONE: 'gray',
  SHORTAGE: 'red',
  CONSUMED: 'gray',
  RELEASED: 'gray',
  PENDING_APPROVAL: 'yellow',
  APPROVED: 'blue',
  RECEIVED: 'green',
  // roles
  ADMIN: 'red',
  FACILITY_MANAGER: 'violet',
  TECHNICIAN: 'orange',
  STAFF: 'teal',
  STUDENT: 'blue',
};

export function statusColor(value: string): MantineColor {
  return COLORS[value] ?? 'gray';
}
