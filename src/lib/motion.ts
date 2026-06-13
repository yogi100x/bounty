/**
 * Motion tokens per DESIGN-SPEC §1. Define once, reuse everywhere.
 * Pass spring configs straight into Reanimated's `withSpring`.
 */

/** Calm: screen/sheet transitions, card entrances. */
export const springSoft = { damping: 18, stiffness: 90 } as const;

/** Decisive: selection, chip fill, the award count-up (slight overshoot). */
export const springPop = { damping: 12, stiffness: 140 } as const;

/** One-shot durations (ms). Idle is slow, reward is fast. */
export const durations = {
  celebration: 800,
  screen: 360,
} as const;
