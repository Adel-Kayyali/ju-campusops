import { Priority, Severity, Urgency } from '@prisma/client';

/**
 * Impact (severity) x urgency matrix used to classify every service request.
 *
 *               | Urgency LOW | MEDIUM | HIGH
 *   ------------+-------------+--------+------
 *   CRITICAL    |     P2      |   P1   |  P1
 *   HIGH        |     P3      |   P2   |  P1
 *   MEDIUM      |     P4      |   P3   |  P2
 *   LOW         |     P4      |   P4   |  P3
 *
 * Safety-related requests are never lower than P2.
 */
export const PRIORITY_MATRIX: Readonly<Record<Severity, Readonly<Record<Urgency, Priority>>>> = {
  CRITICAL: { LOW: Priority.P2, MEDIUM: Priority.P1, HIGH: Priority.P1 },
  HIGH: { LOW: Priority.P3, MEDIUM: Priority.P2, HIGH: Priority.P1 },
  MEDIUM: { LOW: Priority.P4, MEDIUM: Priority.P3, HIGH: Priority.P2 },
  LOW: { LOW: Priority.P4, MEDIUM: Priority.P4, HIGH: Priority.P3 },
};

const PRIORITY_ORDER: Priority[] = [Priority.P1, Priority.P2, Priority.P3, Priority.P4];

export function calculatePriority(severity: Severity, urgency: Urgency, isSafetyRelated: boolean): Priority {
  const fromMatrix = PRIORITY_MATRIX[severity][urgency];
  return isSafetyRelated ? higherOf(fromMatrix, Priority.P2) : fromMatrix;
}

/** Returns the more urgent of two priorities (P1 is the most urgent). */
export function higherOf(a: Priority, b: Priority): Priority {
  return PRIORITY_ORDER.indexOf(a) <= PRIORITY_ORDER.indexOf(b) ? a : b;
}
