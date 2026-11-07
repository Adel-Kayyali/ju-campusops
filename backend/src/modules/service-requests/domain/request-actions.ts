import { RequestStatus, Role } from '@prisma/client';
import { isManagement } from '../../../common/security/role-groups';
import { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { RequestStatusMachine } from './request-status.machine';

/** Actions the UI can offer on a request. Computed by the backend so rules live in one place. */
export enum RequestAction {
  ACKNOWLEDGE = 'ACKNOWLEDGE',
  REJECT = 'REJECT',
  CREATE_WORK_ORDER = 'CREATE_WORK_ORDER',
  CONFIRM_RESOLUTION = 'CONFIRM_RESOLUTION',
  REOPEN = 'REOPEN',
  CLOSE = 'CLOSE',
  ADD_ATTACHMENTS = 'ADD_ATTACHMENTS',
}

export function availableRequestActions(
  request: { status: RequestStatus; requesterId: string; hasActiveWorkOrder: boolean },
  user: AuthenticatedUser,
): RequestAction[] {
  const actions: RequestAction[] = [];
  const manager = isManagement(user.role);
  const isRequester = request.requesterId === user.id;
  const can = (to: RequestStatus) => RequestStatusMachine.canTransition(request.status, to);

  if (manager && request.status === RequestStatus.SUBMITTED) actions.push(RequestAction.ACKNOWLEDGE);
  if (manager && can(RequestStatus.REJECTED)) actions.push(RequestAction.REJECT);
  if (manager && can(RequestStatus.ASSIGNED) && !request.hasActiveWorkOrder) actions.push(RequestAction.CREATE_WORK_ORDER);
  if (isRequester && request.status === RequestStatus.RESOLVED) actions.push(RequestAction.CONFIRM_RESOLUTION, RequestAction.REOPEN);
  if (manager && request.status === RequestStatus.RESOLVED) actions.push(RequestAction.CLOSE);
  if ((isRequester || manager || user.role === Role.TECHNICIAN) && RequestStatusMachine.isOpen(request.status)) {
    actions.push(RequestAction.ADD_ATTACHMENTS);
  }
  return actions;
}
