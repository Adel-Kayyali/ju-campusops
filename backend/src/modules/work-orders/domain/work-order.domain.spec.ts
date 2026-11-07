import { Role, TaskStatus, TaskType, WorkOrderStatus, WorkOrderType } from '@prisma/client';
import { BusinessRuleViolationException, InvalidStateTransitionException } from '../../../common/exceptions/domain.exceptions';
import { buildTaskPlan } from './task-plan';
import { TaskRules } from './task-rules';
import { WorkOrderStatusMachine } from './work-order-status.machine';

describe('buildTaskPlan', () => {
  it('creates inspection -> approval -> repair -> confirmation for a corrective job', () => {
    const plan = buildTaskPlan({ type: WorkOrderType.CORRECTIVE, requiresMaterialApproval: true, hasRequester: true });
    expect(plan.map((t) => t.type)).toEqual([TaskType.INSPECTION, TaskType.MATERIAL_APPROVAL, TaskType.REPAIR, TaskType.REQUESTER_CONFIRMATION]);
    expect(plan[2].dependsOn).toEqual([1, 2]);
    expect(plan[3].dependsOn).toEqual([3]);
  });

  it('skips the approval and confirmation steps when not needed', () => {
    const plan = buildTaskPlan({ type: WorkOrderType.CORRECTIVE, requiresMaterialApproval: false, hasRequester: false });
    expect(plan.map((t) => t.type)).toEqual([TaskType.INSPECTION, TaskType.REPAIR]);
    expect(plan[1].dependsOn).toEqual([1]);
  });

  it('creates a single check for preventive maintenance', () => {
    expect(buildTaskPlan({ type: WorkOrderType.PREVENTIVE, requiresMaterialApproval: false, hasRequester: false })).toHaveLength(1);
  });
});

describe('TaskRules', () => {
  const task = (sequence: number, type: TaskType, status: TaskStatus = TaskStatus.PENDING) => ({ sequence, type, status, title: type });

  it('blocks a task whose prerequisites are not done', () => {
    expect(() => TaskRules.assertPrerequisitesMet(task(3, TaskType.REPAIR), [task(1, TaskType.INSPECTION, TaskStatus.DONE), task(2, TaskType.MATERIAL_APPROVAL)])).toThrow(
      BusinessRuleViolationException,
    );
  });

  it('allows a task once prerequisites are done or skipped', () => {
    expect(() =>
      TaskRules.assertPrerequisitesMet(task(3, TaskType.REPAIR), [task(1, TaskType.INSPECTION, TaskStatus.DONE), task(2, TaskType.MATERIAL_APPROVAL, TaskStatus.SKIPPED)]),
    ).not.toThrow();
  });

  it('reserves material approval for managers', () => {
    const approval = task(2, TaskType.MATERIAL_APPROVAL);
    expect(() => TaskRules.assertActorAllowed(approval, { id: 't', role: Role.TECHNICIAN }, 't')).toThrow(BusinessRuleViolationException);
    expect(() => TaskRules.assertActorAllowed(approval, { id: 'm', role: Role.FACILITY_MANAGER }, 't')).not.toThrow();
  });

  it('only lets the assigned technician work on the repair', () => {
    expect(() => TaskRules.assertActorAllowed(task(3, TaskType.REPAIR), { id: 'other', role: Role.TECHNICIAN }, 't')).toThrow(BusinessRuleViolationException);
  });

  it('considers the work complete without the requester confirmation', () => {
    expect(TaskRules.isWorkComplete([task(1, TaskType.INSPECTION, TaskStatus.DONE), task(2, TaskType.REPAIR, TaskStatus.DONE), task(3, TaskType.REQUESTER_CONFIRMATION)])).toBe(true);
  });
});

describe('WorkOrderStatusMachine', () => {
  it('does not allow verifying an open work order', () => {
    expect(() => WorkOrderStatusMachine.assertTransition(WorkOrderStatus.OPEN, WorkOrderStatus.VERIFIED)).toThrow(InvalidStateTransitionException);
  });
});
