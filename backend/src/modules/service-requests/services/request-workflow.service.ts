import { Injectable } from '@nestjs/common';
import { RequestStatus, ServiceRequest } from '@prisma/client';
import { EntityNotFoundException } from '../../../common/exceptions/domain.exceptions';
import { AuditAction } from '../../audit/domain/audit-action';
import { AuditService } from '../../audit/services/audit.service';
import { NotificationService } from '../../notifications/services/notification.service';
import { RequestStatusMachine } from '../domain/request-status.machine';
import { ServiceRequestRepository } from '../repositories/service-request.repository';

const CLOSING_STATUSES: readonly RequestStatus[] = [RequestStatus.VERIFIED, RequestStatus.CLOSED, RequestStatus.REJECTED];

/** Friendly sentences sent to the requester when the status changes. */
const REQUESTER_MESSAGES: Partial<Record<RequestStatus, string>> = {
  ACKNOWLEDGED: 'has been reviewed by the facilities team',
  ASSIGNED: 'has been assigned to a technician',
  IN_PROGRESS: 'is being worked on',
  RESOLVED: 'has been resolved. Please confirm the repair and rate the service',
  REJECTED: 'was rejected',
  CLOSED: 'has been closed',
  VERIFIED: 'is verified and complete. Thank you for your feedback',
};

/**
 * The only class allowed to change a request's status. Every change is validated by the
 * state machine, written to the status history, audited, and notified to the requester.
 * Used by the request module itself and by the work-order workflow.
 */
@Injectable()
export class RequestWorkflowService {
  constructor(
    private readonly repository: ServiceRequestRepository,
    private readonly notificationService: NotificationService,
    private readonly auditService: AuditService,
  ) {}

  async getRequest(id: string): Promise<ServiceRequest> {
    const request = await this.repository.findById(id);
    if (!request) {
      throw new EntityNotFoundException('ServiceRequest', id);
    }
    return request;
  }

  async transition(
    requestOrId: ServiceRequest | string,
    to: RequestStatus,
    actorId: string,
    note?: string,
    extra: Partial<Pick<ServiceRequest, 'rejectionReason'>> = {},
  ): Promise<ServiceRequest> {
    const request = typeof requestOrId === 'string' ? await this.getRequest(requestOrId) : requestOrId;
    if (request.status === to) {
      return request;
    }
    RequestStatusMachine.assertTransition(request.status, to);

    const now = new Date();
    const updated = await this.repository.update(request.id, {
      status: to,
      ...extra,
      acknowledgedAt: to === RequestStatus.ACKNOWLEDGED || (to === RequestStatus.ASSIGNED && !request.acknowledgedAt) ? now : undefined,
      resolvedAt: to === RequestStatus.RESOLVED ? now : to === RequestStatus.IN_PROGRESS ? null : undefined,
      closedAt: CLOSING_STATUSES.includes(to) ? now : undefined,
    });
    await this.repository.addHistory({ requestId: request.id, fromStatus: request.status, toStatus: to, note: note ?? null, changedById: actorId });
    await this.auditService.record({
      actorId,
      action: AuditAction.REQUEST_STATUS_CHANGED,
      entityType: 'ServiceRequest',
      entityId: request.id,
      details: { code: request.code, from: request.status, to, note },
    });

    const sentence = REQUESTER_MESSAGES[to];
    if (sentence && request.requesterId !== actorId) {
      await this.notificationService.notifyUser(request.requesterId, {
        title: `${request.code} ${to.replace('_', ' ').toLowerCase()}`,
        message: `Your request "${request.title}" ${sentence}.${note ? ` Note: ${note}` : ''}`,
        link: `/requests/${request.id}`,
      });
    }
    return updated;
  }

  // ---- steps driven by the work-order workflow ----

  markAssigned(requestId: string, actorId: string, technicianName: string | null): Promise<ServiceRequest> {
    return this.transition(requestId, RequestStatus.ASSIGNED, actorId, technicianName ? `Assigned to ${technicianName}` : 'Work order created');
  }

  async markInProgress(requestId: string, actorId: string): Promise<void> {
    const request = await this.getRequest(requestId);
    if (request.status === RequestStatus.ASSIGNED) {
      await this.transition(request, RequestStatus.IN_PROGRESS, actorId, 'Technician started the work');
    }
  }

  async markResolved(requestId: string, actorId: string, repairNotes: string): Promise<void> {
    const request = await this.getRequest(requestId);
    if (request.status === RequestStatus.ASSIGNED) {
      await this.transition(request, RequestStatus.IN_PROGRESS, actorId);
    }
    await this.transition(requestId, RequestStatus.RESOLVED, actorId, repairNotes);
  }

  /** The work order was cancelled: the request goes back to the coordinator's queue. */
  async markUnassigned(requestId: string, actorId: string, reason: string): Promise<void> {
    const request = await this.getRequest(requestId);
    if (request.status === RequestStatus.ASSIGNED || request.status === RequestStatus.IN_PROGRESS) {
      await this.transition(request, RequestStatus.ACKNOWLEDGED, actorId, `Work order cancelled: ${reason}`);
    }
  }
}
