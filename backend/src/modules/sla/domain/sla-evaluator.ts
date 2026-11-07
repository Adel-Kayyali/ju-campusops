/** Service-level state shown next to each request. */
export enum SlaState {
  ON_TRACK = 'ON_TRACK',
  AT_RISK = 'AT_RISK',
  BREACHED = 'BREACHED',
  MET = 'MET',
  MISSED = 'MISSED',
}

export interface SlaInput {
  createdAt: Date;
  resolutionDueAt: Date;
  /** When the work was resolved, or null when still open. */
  resolvedAt: Date | null;
  now: Date;
}

/** Share of the allowed time after which an open request is flagged "at risk". */
export const AT_RISK_THRESHOLD = 0.75;

/** Pure function: decides whether a request is on track, at risk or late. */
export function evaluateSla({ createdAt, resolutionDueAt, resolvedAt, now }: SlaInput): SlaState {
  if (resolvedAt) {
    return resolvedAt <= resolutionDueAt ? SlaState.MET : SlaState.MISSED;
  }
  if (now > resolutionDueAt) {
    return SlaState.BREACHED;
  }
  const allowed = resolutionDueAt.getTime() - createdAt.getTime();
  const used = now.getTime() - createdAt.getTime();
  return allowed > 0 && used / allowed >= AT_RISK_THRESHOLD ? SlaState.AT_RISK : SlaState.ON_TRACK;
}
