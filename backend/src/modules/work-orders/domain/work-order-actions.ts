import { WorkOrderStatus, WorkOrderType } from '@prisma/client';
import { isManagement } from '../../../common/security/role-groups';
import { AuthenticatedUser } from '../../../common/types/authenticated-user';
import { WorkOrderStatusMachine } from './work-order-status.machine';

/** Work-order level actions offered by the UI (task actions are per task). */
export enum WorkOrderAction {
  ASSIGN = 'ASSIGN',
  CANCEL = 'CANCEL',
  VERIFY = 'VERIFY',
  ADD_MATERIAL = 'ADD_MATERIAL',
  ADD_EVIDENCE = 'ADD_EVIDENCE',
}

export function availableWorkOrderActions(
  workOrder: { status: WorkOrderStatus; type: WorkOrderType; technicianId: string | null; requestId: string | null },
  user: AuthenticatedUser,
): WorkOrderAction[] {
  const manager = isManagement(user.role);
  const assigned = workOrder.technicianId === user.id;
  const active = WorkOrderStatusMachine.isActive(workOrder.status);
  const actions: WorkOrderAction[] = [];

  if (manager && active) actions.push(WorkOrderAction.ASSIGN, WorkOrderAction.CANCEL);
  // Jobs without a requester (preventive / asset jobs) are verified by a manager.
  if (manager && workOrder.status === WorkOrderStatus.COMPLETED && !workOrder.requestId) actions.push(WorkOrderAction.VERIFY);
  if ((manager || assigned) && active) actions.push(WorkOrderAction.ADD_MATERIAL);
  if ((manager || assigned) && (active || workOrder.status === WorkOrderStatus.COMPLETED)) actions.push(WorkOrderAction.ADD_EVIDENCE);
  return actions;
}
