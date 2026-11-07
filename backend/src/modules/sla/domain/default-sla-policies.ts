import { Priority } from '@prisma/client';

export interface SlaTargets {
  responseHours: number;
  resolutionHours: number;
  description: string;
}

/** Defaults used when the administrator has not configured a policy yet. */
export const DEFAULT_SLA_POLICIES: Readonly<Record<Priority, SlaTargets>> = {
  P1: { responseHours: 1, resolutionHours: 8, description: 'Critical - safety risk or campus-wide impact' },
  P2: { responseHours: 4, resolutionHours: 24, description: 'High - a whole room or service is unusable' },
  P3: { responseHours: 24, resolutionHours: 72, description: 'Medium - degraded service, workaround exists' },
  P4: { responseHours: 48, resolutionHours: 168, description: 'Low - cosmetic or minor issue' },
};
