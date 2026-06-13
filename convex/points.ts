// Points model — single source of truth for award values.
// Mirrors docs/IMPLEMENTATION-PLAN.md §3 "Proposed point values".
// NOTE: BASE points are per-habit (habit.pointValue, default 10 in seed data);
// the constants below are the fixed bonuses layered on top.

export const PROOF_BONUS = 5;
export const ON_TIME_BEREAL_BONUS = 5;

/** Streak-length → bonus points awarded once when the threshold is crossed. */
export const MILESTONES: Record<number, number> = {
  7: 50,
  30: 200,
  100: 500,
};

/** Ordered milestone thresholds (ascending) for iteration. */
export const MILESTONE_THRESHOLDS = Object.keys(MILESTONES)
  .map(Number)
  .sort((a, b) => a - b);

export type PointsBreakdown = {
  basePoints: number;
  proofBonus: number;
  onTimeBonus: number;
  milestoneBonus: number;
  total: number;
  milestoneValue?: number;
};

/**
 * Compute the points for a completion.
 * @param basePoints  habit.pointValue
 * @param hasProof    a proof was attached to this completion
 * @param onTimeBeReal completion came from an on-time BeReal capture
 * @param newStreak   the streak count AFTER this completion (to detect milestone)
 */
export function computePoints({
  basePoints,
  hasProof,
  onTimeBeReal,
  newStreak,
}: {
  basePoints: number;
  hasProof: boolean;
  onTimeBeReal: boolean;
  newStreak: number;
}): PointsBreakdown {
  const proofBonus = hasProof ? PROOF_BONUS : 0;
  const onTimeBonus = onTimeBeReal ? ON_TIME_BEREAL_BONUS : 0;
  const milestoneValue = MILESTONES[newStreak]; // exact-threshold match only
  const milestoneBonus = milestoneValue ?? 0;

  return {
    basePoints,
    proofBonus,
    onTimeBonus,
    milestoneBonus,
    total: basePoints + proofBonus + onTimeBonus + milestoneBonus,
    milestoneValue,
  };
}
