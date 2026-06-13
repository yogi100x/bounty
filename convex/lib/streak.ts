// Pure streak engine — NO Convex dependencies, so it is trivially unit-testable
// in isolation (see docs/IMPLEMENTATION-PLAN.md §3 "Streak engine").
//
// Day-boundary reasoning
// ----------------------
// All day math is done on ISO local-date strings ("YYYY-MM-DD") that the CLIENT
// computes in the user's IANA timezone and passes to the server. We deliberately
// do NOT do timezone arithmetic here with Date objects, because:
//   - The server runs in UTC; reconstructing "what day is it for this user" from
//     a UTC timestamp is error-prone around midnight and DST transitions.
//   - The client already knows its tz, so it is the source of truth for "today"
//     and "yesterday" as the user perceives them.
// This sidesteps DST entirely: a DST "spring forward" / "fall back" day is still
// exactly one calendar date, and `todayISO` / `yesterdayISO` are computed in
// local time, so a 23h or 25h day still counts as a single consecutive day.

export type StreakInput = {
  /** The streak's stored lastCompletedDate (YYYY-MM-DD) or null if never done. */
  lastCompletedDate: string | null;
  /** Current consecutive-day count before this completion. */
  current: number;
  /** All-time longest streak before this completion. */
  longest: number;
  /** The user's local "today" (YYYY-MM-DD), computed client-side in their tz. */
  todayISO: string;
  /** The user's local "yesterday" (YYYY-MM-DD), computed client-side in their tz. */
  yesterdayISO: string;
  /** Whether a streak pause (mercy/freeze) is available to bridge a gap. */
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

/**
 * Compute the next streak state for a single completion event.
 *
 * Rules:
 *  - Same-day repeat: if lastCompletedDate === todayISO, nothing changes
 *    (idempotent — the caller should also guard via the unique-completion index,
 *    but the engine is defensive too).        // → "double-submit" case
 *  - Continuation: if lastCompletedDate === yesterdayISO, current += 1.
 *    (DST does not break this — yesterdayISO is a local calendar date.)
 *  - First ever / cold start: lastCompletedDate === null → current = 1.
 *  - Gap with pause: if there is a gap (>1 day) and `hasPause`, consume the
 *    pause and CONTINUE the streak (current += 1) instead of resetting.
 *    // → "pause-then-return" case
 *  - Gap without pause: any other gap resets current to 1 (hard reset).
 *  longest is bumped to max(longest, current) whenever current grows.
 */
export function computeNextStreak(input: StreakInput): StreakResult {
  const { lastCompletedDate, current, longest, todayISO, yesterdayISO, hasPause } =
    input;

  // Same local day → idempotent no-op. (DST example: even if the clock changed
  // overnight, todayISO is the same string the client computed, so a second tap
  // today never double-counts.)
  if (lastCompletedDate === todayISO) {
    return {
      current,
      longest,
      lastCompletedDate: todayISO,
      pauseConsumed: false,
      alreadyCompletedToday: true,
    };
  }

  let nextCurrent: number;
  let pauseConsumed = false;

  if (lastCompletedDate === null) {
    // Cold start — first ever completion for this habit.
    nextCurrent = 1;
  } else if (lastCompletedDate === yesterdayISO) {
    // Consecutive day → continue the streak.
    nextCurrent = current + 1;
  } else if (hasPause) {
    // There is a gap (missed one or more days) but a pause is available.
    // pause-then-return example: done Mon, skipped Tue, returns Wed with a
    // pause → Wed continues the streak (current += 1) and the pause is spent.
    nextCurrent = current + 1;
    pauseConsumed = true;
  } else {
    // Gap with no mercy left → hard reset, today is day 1.
    nextCurrent = 1;
  }

  return {
    current: nextCurrent,
    longest: Math.max(longest, nextCurrent),
    lastCompletedDate: todayISO,
    pauseConsumed,
    alreadyCompletedToday: false,
  };
}
