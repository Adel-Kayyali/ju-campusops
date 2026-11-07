/** Domain events published by the service-request module (consumed by work orders). */
export const RequestEvents = {
  CONFIRMED: 'service-request.confirmed',
  REOPENED: 'service-request.reopened',
  CLOSED: 'service-request.closed',
} as const;

export class RequestConfirmedEvent {
  constructor(
    readonly requestId: string,
    readonly actorId: string,
  ) {}
}

export class RequestReopenedEvent {
  constructor(
    readonly requestId: string,
    readonly actorId: string,
    readonly reason: string,
  ) {}
}

export class RequestClosedEvent {
  constructor(
    readonly requestId: string,
    readonly actorId: string,
  ) {}
}
