import { RequestStatus } from '@prisma/client';
import { InvalidStateTransitionException } from '../../../common/exceptions/domain.exceptions';

/**
 * Lifecycle of a service request ("Issue Reported" -> "Work Verified").
 *
 *   SUBMITTED -> ACKNOWLEDGED -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> VERIFIED
 *        |            |                                       |  \
 *        +-> REJECTED +                                       |   +-> CLOSED (by manager)
 *                                                             +-> IN_PROGRESS (re-opened by requester)
 *
 * ASSIGNED / IN_PROGRESS -> ACKNOWLEDGED when the work order is cancelled (back to the coordinator's queue).
 */
const TRANSITIONS: Readonly<Record<RequestStatus, readonly RequestStatus[]>> = {
  SUBMITTED: [RequestStatus.ACKNOWLEDGED, RequestStatus.ASSIGNED, RequestStatus.REJECTED],
  ACKNOWLEDGED: [RequestStatus.ASSIGNED, RequestStatus.REJECTED],
  ASSIGNED: [RequestStatus.IN_PROGRESS, RequestStatus.ACKNOWLEDGED],
  IN_PROGRESS: [RequestStatus.RESOLVED, RequestStatus.ACKNOWLEDGED],
  RESOLVED: [RequestStatus.VERIFIED, RequestStatus.CLOSED, RequestStatus.IN_PROGRESS],
  VERIFIED: [],
  REJECTED: [],
  CLOSED: [],
};

export const OPEN_REQUEST_STATUSES: readonly RequestStatus[] = [
  RequestStatus.SUBMITTED,
  RequestStatus.ACKNOWLEDGED,
  RequestStatus.ASSIGNED,
  RequestStatus.IN_PROGRESS,
];

export const FINISHED_REQUEST_STATUSES: readonly RequestStatus[] = [RequestStatus.RESOLVED, RequestStatus.VERIFIED, RequestStatus.CLOSED];

export class RequestStatusMachine {
  static canTransition(from: RequestStatus, to: RequestStatus): boolean {
    return TRANSITIONS[from].includes(to);
  }

  static assertTransition(from: RequestStatus, to: RequestStatus): void {
    if (!RequestStatusMachine.canTransition(from, to)) {
      throw new InvalidStateTransitionException('ServiceRequest', from, to);
    }
  }

  static isOpen(status: RequestStatus): boolean {
    return OPEN_REQUEST_STATUSES.includes(status);
  }
}
