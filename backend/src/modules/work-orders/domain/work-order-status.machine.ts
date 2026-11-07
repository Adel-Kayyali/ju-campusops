import { WorkOrderStatus } from '@prisma/client';
import { InvalidStateTransitionException } from '../../../common/exceptions/domain.exceptions';

/**
 *   OPEN -> IN_PROGRESS -> COMPLETED -> VERIFIED
 *     \          |            |
 *      +---------+--> CANCELLED      COMPLETED -> IN_PROGRESS (requester re-opened the issue)
 */
const TRANSITIONS: Readonly<Record<WorkOrderStatus, readonly WorkOrderStatus[]>> = {
  OPEN: [WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.CANCELLED],
  IN_PROGRESS: [WorkOrderStatus.COMPLETED, WorkOrderStatus.CANCELLED],
  COMPLETED: [WorkOrderStatus.VERIFIED, WorkOrderStatus.IN_PROGRESS],
  VERIFIED: [],
  CANCELLED: [],
};

export const ACTIVE_WORK_ORDER_STATUSES: readonly WorkOrderStatus[] = [WorkOrderStatus.OPEN, WorkOrderStatus.IN_PROGRESS];

export class WorkOrderStatusMachine {
  static canTransition(from: WorkOrderStatus, to: WorkOrderStatus): boolean {
    return TRANSITIONS[from].includes(to);
  }

  static assertTransition(from: WorkOrderStatus, to: WorkOrderStatus): void {
    if (!WorkOrderStatusMachine.canTransition(from, to)) {
      throw new InvalidStateTransitionException('WorkOrder', from, to);
    }
  }

  static isActive(status: WorkOrderStatus): boolean {
    return ACTIVE_WORK_ORDER_STATUSES.includes(status);
  }
}
