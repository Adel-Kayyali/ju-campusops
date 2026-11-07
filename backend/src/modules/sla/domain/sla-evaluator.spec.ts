import { evaluateSla, SlaState } from './sla-evaluator';

const hours = (h: number) => h * 3_600_000;
const createdAt = new Date('2026-11-01T08:00:00Z');
const resolutionDueAt = new Date(createdAt.getTime() + hours(8));

describe('evaluateSla', () => {
  it('is ON_TRACK early in the window', () => {
    expect(evaluateSla({ createdAt, resolutionDueAt, resolvedAt: null, now: new Date(createdAt.getTime() + hours(2)) })).toBe(SlaState.ON_TRACK);
  });

  it('is AT_RISK after 75% of the allowed time', () => {
    expect(evaluateSla({ createdAt, resolutionDueAt, resolvedAt: null, now: new Date(createdAt.getTime() + hours(7)) })).toBe(SlaState.AT_RISK);
  });

  it('is BREACHED when an open request passes its due time', () => {
    expect(evaluateSla({ createdAt, resolutionDueAt, resolvedAt: null, now: new Date(createdAt.getTime() + hours(9)) })).toBe(SlaState.BREACHED);
  });

  it('is MET or MISSED once resolved', () => {
    expect(evaluateSla({ createdAt, resolutionDueAt, resolvedAt: new Date(createdAt.getTime() + hours(5)), now: new Date() })).toBe(SlaState.MET);
    expect(evaluateSla({ createdAt, resolutionDueAt, resolvedAt: new Date(createdAt.getTime() + hours(10)), now: new Date() })).toBe(SlaState.MISSED);
  });
});
