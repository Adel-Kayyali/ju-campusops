import { RequestCategory } from '@prisma/client';

export interface TechnicianCandidate {
  userId: string;
  fullName: string;
  skills: RequestCategory[];
  homeBuildingId: string | null;
  isAvailable: boolean;
  openWorkOrders: number;
  maxOpenOrders: number;
}

export interface MatchCriteria {
  category: RequestCategory;
  buildingId: string;
}

export interface TechnicianMatch {
  userId: string;
  fullName: string;
  score: number;
  openWorkOrders: number;
  /** Human-readable explanation of the score (transparency for the coordinator). */
  reasons: string[];
  isRecommended: boolean;
}

/** Weights of the matching score (0..100). */
export const MATCH_WEIGHTS = { SKILL: 50, LOCATION: 20, WORKLOAD: 30 } as const;

/**
 * Ranks technicians for a job by skill, location and current workload.
 * Unavailable or fully-booked technicians are listed last with score 0;
 * the coordinator always makes the final decision.
 */
export function rankTechnicians(candidates: readonly TechnicianCandidate[], criteria: MatchCriteria): TechnicianMatch[] {
  const matches = candidates.map((candidate): TechnicianMatch => {
    const reasons: string[] = [];
    if (!candidate.isAvailable) {
      return { ...base(candidate), score: 0, reasons: ['Currently unavailable'], isRecommended: false };
    }
    if (candidate.openWorkOrders >= candidate.maxOpenOrders) {
      return { ...base(candidate), score: 0, reasons: [`Fully booked (${candidate.openWorkOrders}/${candidate.maxOpenOrders} open orders)`], isRecommended: false };
    }

    let score = 0;
    if (candidate.skills.includes(criteria.category)) {
      score += MATCH_WEIGHTS.SKILL;
      reasons.push(`Has ${criteria.category.replace('_', ' ').toLowerCase()} skill`);
    } else {
      reasons.push('No matching skill');
    }
    if (candidate.homeBuildingId === criteria.buildingId) {
      score += MATCH_WEIGHTS.LOCATION;
      reasons.push('Based in the same building');
    }
    const freeShare = 1 - candidate.openWorkOrders / candidate.maxOpenOrders;
    score += Math.round(MATCH_WEIGHTS.WORKLOAD * freeShare);
    reasons.push(`${candidate.openWorkOrders} open work order(s)`);

    return { ...base(candidate), score, reasons, isRecommended: false };
  });

  matches.sort((a, b) => b.score - a.score || a.openWorkOrders - b.openWorkOrders || a.fullName.localeCompare(b.fullName));
  if (matches.length > 0 && matches[0].score > 0) {
    matches[0].isRecommended = true;
  }
  return matches;
}

function base(candidate: TechnicianCandidate): Pick<TechnicianMatch, 'userId' | 'fullName' | 'openWorkOrders'> {
  return { userId: candidate.userId, fullName: candidate.fullName, openWorkOrders: candidate.openWorkOrders };
}
