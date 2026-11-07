import { TaskType, WorkOrderType } from '@prisma/client';

/** A task to create, with the sequence numbers of the tasks it depends on. */
export interface TaskBlueprint {
  sequence: number;
  type: TaskType;
  title: string;
  dependsOn: number[];
}

export interface TaskPlanOptions {
  type: WorkOrderType;
  requiresMaterialApproval: boolean;
  hasRequester: boolean;
}

/**
 * Builds the dependent task list of a new work order.
 *
 * Corrective:  1 Inspection -> 2 Material approval (optional) -> 3 Repair -> 4 Requester confirmation
 * Preventive:  1 Preventive check
 */
export function buildTaskPlan(options: TaskPlanOptions): TaskBlueprint[] {
  if (options.type === WorkOrderType.PREVENTIVE) {
    return [{ sequence: 1, type: TaskType.PREVENTIVE_CHECK, title: 'Perform the scheduled inspection / service', dependsOn: [] }];
  }

  const plan: TaskBlueprint[] = [{ sequence: 1, type: TaskType.INSPECTION, title: 'Inspect the problem on site', dependsOn: [] }];
  const repairPrerequisites = [1];
  if (options.requiresMaterialApproval) {
    plan.push({ sequence: 2, type: TaskType.MATERIAL_APPROVAL, title: 'Approve the materials needed for the repair', dependsOn: [1] });
    repairPrerequisites.push(2);
  }
  const repairSequence = plan.length + 1;
  plan.push({ sequence: repairSequence, type: TaskType.REPAIR, title: 'Carry out the repair', dependsOn: repairPrerequisites });
  if (options.hasRequester) {
    plan.push({ sequence: repairSequence + 1, type: TaskType.REQUESTER_CONFIRMATION, title: 'Requester confirms the repair', dependsOn: [repairSequence] });
  }
  return plan;
}
