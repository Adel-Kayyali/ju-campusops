import { Role, TaskStatus, TaskType } from '@prisma/client';
import { BusinessRuleViolationException, InvalidStateTransitionException } from '../../../common/exceptions/domain.exceptions';
import { isManagement } from '../../../common/security/role-groups';

export interface TaskLike {
  sequence: number;
  type: TaskType;
  status: TaskStatus;
  title: string;
}

/** A prerequisite is satisfied once it is DONE or SKIPPED. */
export function isSatisfied(status: TaskStatus): boolean {
  return status === TaskStatus.DONE || status === TaskStatus.SKIPPED;
}

/** Task types whose completion records the repair notes (and resolves the work). */
export const WORK_TASK_TYPES: readonly TaskType[] = [TaskType.REPAIR, TaskType.PREVENTIVE_CHECK];

export class TaskRules {
  /** A task can start only when every task it depends on is satisfied. */
  static assertPrerequisitesMet(task: TaskLike, prerequisites: readonly TaskLike[]): void {
    const pending = prerequisites.filter((p) => !isSatisfied(p.status));
    if (pending.length > 0) {
      throw new BusinessRuleViolationException(
        `"${task.title}" is waiting for: ${pending.map((p) => `#${p.sequence} ${p.title}`).join(', ')}`,
        'TASK_DEPENDENCY_NOT_MET',
        { waitingFor: pending.map((p) => p.sequence) },
      );
    }
  }

  static assertCanStart(task: TaskLike): void {
    if (task.status !== TaskStatus.PENDING) {
      throw new InvalidStateTransitionException('Task', task.status, TaskStatus.IN_PROGRESS);
    }
  }

  static assertCanComplete(task: TaskLike): void {
    if (task.status !== TaskStatus.PENDING && task.status !== TaskStatus.IN_PROGRESS) {
      throw new InvalidStateTransitionException('Task', task.status, TaskStatus.DONE);
    }
  }

  /**
   * Who may act on a task type:
   *  - material approval: facility managers / admins only
   *  - requester confirmation: nobody directly (done by the requester confirming the request)
   *  - inspection / repair / preventive check: the assigned technician or management
   */
  static assertActorAllowed(task: TaskLike, actor: { id: string; role: Role }, assignedTechnicianId: string | null): void {
    if (task.type === TaskType.REQUESTER_CONFIRMATION) {
      throw new BusinessRuleViolationException('This step is completed when the requester confirms the repair', 'REQUESTER_STEP');
    }
    if (task.type === TaskType.MATERIAL_APPROVAL) {
      if (!isManagement(actor.role)) {
        throw new BusinessRuleViolationException('Only a facility manager can approve materials', 'MANAGER_APPROVAL_REQUIRED');
      }
      return;
    }
    if (!isManagement(actor.role) && actor.id !== assignedTechnicianId) {
      throw new BusinessRuleViolationException('Only the assigned technician can update this task', 'NOT_ASSIGNED_TECHNICIAN');
    }
  }

  /** The work is done when every task other than the requester confirmation is satisfied. */
  static isWorkComplete(tasks: readonly TaskLike[]): boolean {
    return tasks.filter((t) => t.type !== TaskType.REQUESTER_CONFIRMATION).every((t) => isSatisfied(t.status));
  }
}
