import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { RequestClosedEvent, RequestConfirmedEvent, RequestEvents, RequestReopenedEvent } from '../../service-requests/events/request.events';
import { WorkOrderTaskService } from '../services/work-order-task.service';

/**
 * Reacts to service-request events (observer pattern).
 * Handlers run synchronously inside the publisher's transaction, and errors are NOT
 * suppressed, so a failure rolls back the whole operation.
 */
@Injectable()
export class ServiceRequestListener {
  constructor(private readonly taskService: WorkOrderTaskService) {}

  @OnEvent(RequestEvents.CONFIRMED, { suppressErrors: false })
  handleConfirmed(event: RequestConfirmedEvent): Promise<void> {
    return this.taskService.onRequesterConfirmed(event.requestId, event.actorId);
  }

  @OnEvent(RequestEvents.CLOSED, { suppressErrors: false })
  handleClosed(event: RequestClosedEvent): Promise<void> {
    return this.taskService.onRequestClosed(event.requestId, event.actorId);
  }

  @OnEvent(RequestEvents.REOPENED, { suppressErrors: false })
  handleReopened(event: RequestReopenedEvent): Promise<void> {
    return this.taskService.onRequestReopened(event.requestId, event.actorId, event.reason);
  }
}
