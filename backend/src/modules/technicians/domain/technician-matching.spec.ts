import { RequestCategory } from '@prisma/client';
import { rankTechnicians, TechnicianCandidate } from './technician-matching';

const candidate = (overrides: Partial<TechnicianCandidate>): TechnicianCandidate => ({
  userId: overrides.fullName ?? 'x',
  fullName: 'x',
  skills: [],
  homeBuildingId: null,
  isAvailable: true,
  openWorkOrders: 0,
  maxOpenOrders: 5,
  ...overrides,
});

describe('rankTechnicians', () => {
  const criteria = { category: RequestCategory.ELECTRICAL, buildingId: 'eng' };

  it('recommends the skilled, local, least busy technician', () => {
    const ranked = rankTechnicians(
      [
        candidate({ fullName: 'Busy electrician', skills: [RequestCategory.ELECTRICAL], openWorkOrders: 4 }),
        candidate({ fullName: 'Local electrician', skills: [RequestCategory.ELECTRICAL], homeBuildingId: 'eng', openWorkOrders: 1 }),
        candidate({ fullName: 'Plumber', skills: [RequestCategory.PLUMBING] }),
      ],
      criteria,
    );
    expect(ranked[0].fullName).toBe('Local electrician');
    expect(ranked[0].isRecommended).toBe(true);
    expect(ranked[0].reasons).toContain('Based in the same building');
  });

  it('puts unavailable and fully booked technicians last with score 0', () => {
    const ranked = rankTechnicians(
      [
        candidate({ fullName: 'Away', skills: [RequestCategory.ELECTRICAL], isAvailable: false }),
        candidate({ fullName: 'Full', skills: [RequestCategory.ELECTRICAL], openWorkOrders: 5 }),
        candidate({ fullName: 'Generalist' }),
      ],
      criteria,
    );
    expect(ranked[0].fullName).toBe('Generalist');
    expect(ranked.slice(1).every((match) => match.score === 0)).toBe(true);
  });
});
