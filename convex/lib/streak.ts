// Pure streak engine — NO Convex dependencies, so it is trivially unit-testable
// in isolation (see docs/IMPLEMENTATION-PLAN.md §3/§7 "Streak engine").
//
// Day-boundary reasoning
// ----------------------
// All day math is done on ISO local-date strings ("YYYY-MM-DD") that the CLIENT
// computes in the user's IANA timezone and passes as `todayISO`. The gap between
// two local dates is computed by parsing them at UTC midnight and differencing —
// pure calendar arithmetic, so DST (a 23h or 25h day) never affects the count: a
// single calendar date is always exactly one day apart from the next.

export type StreakInput = {
  /** The streak's stored lastCompletedDate (YYYY-MM-DD) or null if never done. */
  lastCompletedDate: string | null;
  /** Current consecutive-day count before this completion. */
  current: number;
  /** All-time longest streak before this completion. */
  longest: number;
  /** The user's local "today" (YYYY-MM-DD), computed client-side in their tz. */
  todayISO: string;
  /** @deprecated No longer used — the gap is derived from lastCompletedDate vs
   *  todayISO. Kept so existing callers compile; safe to remove later. */
  yesterdayISO?: string;
  /** Whether a streak pause (mercy/freeze) is available to bridge a 1-day gap. */
  hasPause: boolean;
};

export type StreakResult = {
  current: number;
  longest: number;
  lastCompletedDate: string;
  /** True when a pause was consumed to keep the streak alive across a gap. */
  pauseConsumed: boolean;
  /** True when this completion is a no-op repeat for the same local day. */
  alreadyCompletedToday: boolean;
};

/** Calendar-day difference between two YYYY-MM-DD dates (DST-safe, date-only). */
export function diffCalendarDays(fromISO: string, toISO: string): number {
  const [fy, fm, fd] = fromISO.split('-').map(Number);
  const [ty, tm, td] = toISO.split('-').map(Number);
  const from = Date.UTC(fy, fm - 1, fd);
  const to = Date.UTC(ty, tm - 1, td);
  return Math.round((to - from) / 86_400_000);
}

/**
 * Compute the next streak state for a single completion event.
 *
 * Rules (gap = calendar days between lastCompletedDate and today):
 *  - gap 0  (same day):   idempotent no-op. // double-submit
 *  - null   (cold start): current = 1.
 *  - gap 1  (consecutive): current += 1.
 *  - gap 2  (missed ONE day) + hasPause: bridge — current += 1, pause consumed.
 *                                        // pause-then-return
 *  - any larger gap, or gap 2 without a pause: hard reset to 1.
 *  - gap <= 0 anomaly (stored future date): no-op, advance the date, keep count.
 *  longest is bumped to max(longest, current) whenever current changes.
 *
 * Note: a pause only bridges a SINGLE missed day (gap === 2). Bridging arbitrary
 * gaps would let a stale streak resurrect after weeks away.
 */
export function computeNextStreak(input: StreakInput): StreakResult {
  const { lastCompletedDate, current, longest, todayISO, hasPause } = input;

  // Same local day → idempotent no-op (the DB unique index also guards this).
  if (lastCompletedDate === todayISO) {
    return {
      current,
      longest,
      lastCompletedDate: todayISO,
      pauseConsumed: false,
      alreadyCompletedToday: true,
    };
  }

  // Cold start — first ever completion for this habit.
  if (lastCompletedDate === null) {
    return {
      current: 1,
      longest: Math.max(longest, 1),
      lastCompletedDate: todayISO,
      pauseConsumed: false,
      alreadyCompletedToday: false,
    };
  }

  const gap = diffCalendarDays(lastCompletedDate, todayISO);

  // Anomaly: stored date is in the future (clock skew / bad input). Don't reward
  // or punish — keep the count, advance the marker to today.
  if (gap <= 0) {
    return {
      current,
      longest,
      lastCompletedDate: todayISO,
      pauseConsumed: false,
      alreadyCompletedToday: false,
    };
  }

  let nextCurrent: number;
  let pauseConsumed = false;

  if (gap === 1) {
    nextCurrent = current + 1; // consecutive day
  } else if (gap === 2 && hasPause) {
    nextCurrent = current + 1; // missed exactly one day, bridged by a pause
    pauseConsumed = true;
  } else {
    nextCurrent = 1; // gap too large, or no mercy left → hard reset
  }

  return {
    current: nextCurrent,
    longest: Math.max(longest, nextCurrent),
    lastCompletedDate: todayISO,
    pauseConsumed,
    alreadyCompletedToday: false,
  };
}
