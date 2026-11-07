import type { Priority, Severity, Urgency } from '@/shared/types/enums';

/**
 * Copy of the backend's impact (severity) x urgency matrix
 * (backend/src/modules/sla/domain/priority-matrix.ts), displayed for information only.
 * Safety-related requests are never lower than P2.
 */
export const PRIORITY_MATRIX: Record<Severity, Record<Urgency, Priority>> = {
  CRITICAL: { LOW: 'P2', MEDIUM: 'P1', HIGH: 'P1' },
  HIGH: { LOW: 'P3', MEDIUM: 'P2', HIGH: 'P1' },
  MEDIUM: { LOW: 'P4', MEDIUM: 'P3', HIGH: 'P2' },
  LOW: { LOW: 'P4', MEDIUM: 'P4', HIGH: 'P3' },
};
