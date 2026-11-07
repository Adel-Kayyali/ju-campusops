import { RequestStatus, Role } from '@prisma/client';
import { InvalidStateTransitionException } from '../../../common/exceptions/domain.exceptions';
import { availableRequestActions, RequestAction } from './request-actions';
import { RequestStatusMachine } from './request-status.machine';

describe('RequestStatusMachine', () => {
  it('allows the happy path from SUBMITTED to VERIFIED', () => {
    const path = [RequestStatus.SUBMITTED, RequestStatus.ACKNOWLEDGED, RequestStatus.ASSIGNED, RequestStatus.IN_PROGRESS, RequestStatus.RESOLVED, RequestStatus.VERIFIED];
    for (let i = 0; i < path.length - 1; i++) {
      expect(RequestStatusMachine.canTransition(path[i], path[i + 1])).toBe(true);
    }
  });

  it('rejects skipping the repair (SUBMITTED -> RESOLVED)', () => {
    expect(() => RequestStatusMachine.assertTransition(RequestStatus.SUBMITTED, RequestStatus.RESOLVED)).toThrow(InvalidStateTransitionException);
  });

  it('treats VERIFIED, REJECTED and CLOSED as final', () => {
    for (const final of [RequestStatus.VERIFIED, RequestStatus.REJECTED, RequestStatus.CLOSED]) {
      expect(Object.values(RequestStatus).some((to) => RequestStatusMachine.canTransition(final, to))).toBe(false);
    }
  });
});

describe('availableRequestActions', () => {
  const manager = { id: 'm', email: 'm', fullName: 'M', role: Role.FACILITY_MANAGER };
  const student = { id: 's', email: 's', fullName: 'S', role: Role.STUDENT };

  it('lets a manager acknowledge, reject or dispatch a new request', () => {
    const actions = availableRequestActions({ status: RequestStatus.SUBMITTED, requesterId: 's', hasActiveWorkOrder: false }, manager);
    expect(actions).toEqual(expect.arrayContaining([RequestAction.ACKNOWLEDGE, RequestAction.REJECT, RequestAction.CREATE_WORK_ORDER]));
  });

  it('lets only the requester confirm a resolved request', () => {
    const resolved = { status: RequestStatus.RESOLVED, requesterId: 's', hasActiveWorkOrder: true };
    expect(availableRequestActions(resolved, student)).toContain(RequestAction.CONFIRM_RESOLUTION);
    expect(availableRequestActions(resolved, manager)).not.toContain(RequestAction.CONFIRM_RESOLUTION);
  });
});
