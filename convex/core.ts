// Aggregate reads for the Today / Profile / Progress / Ledger screens. The
// `snapshot` query is one round-trip and stays reactively live. It is resilient
// to a brand-new signed-in user whose `users` row doesn't exist yet (queries
// can't create rows) — it returns an empty-but-valid snapshot until the first
// mutation (onboarding) provisions the user.

import { query } from './_generated/server';
import type { QueryCtx } from './_generated/server';
import { v } from 'convex/values';
import { currentBalance } from './lib/users';
import type { Doc, Id } from './_generated/dataModel';

const DEFAULT_AVATAR_COLOR = '#8B5CF6';

type EnrichedHabit = Doc<'habits'> & {
  current: number;
  longest: number;
  doneToday: boolean;
};

async function findUser(ctx: QueryCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return { identity: null, user: null };
  const user = await ctx.db
    .query('users')
    .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
    .unique();
  return { identity, user };
}

export const snapshot = query({
  args: {
    weekday: v.number(), // client local weekday, 0=Sun..6=Sat
    localDate: v.string(), // client local YYYY-MM-DD "today"
  },
  handler: async (ctx, { weekday, localDate }) => {
    const { identity, user } = await findUser(ctx);

    // Not provisioned yet (first sign-in, pre-onboarding): empty snapshot.
    if (!user) {
      return {
        profile: {
          name: identity?.name ?? '',
          avatarColor: DEFAULT_AVATAR_COLOR,
          onboarded: false,
        },
        points: 0,
        lifetimeEarned: 0,
        habits: [] as EnrichedHabit[],
        dueHabitIds: [] as Id<'habits'>[],
        totalCompletions: 0,
        bestCurrentStreak: 0,
        longestStreak: 0,
        recentCompletionDates: [] as string[],
      };
    }

    const points = await currentBalance(ctx, user._id);

    // Lifetime earned = sum of positive ledger deltas. V1-bounded to 500 rows.
    const ledger = await ctx.db
      .query('pointsLedger')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .order('desc')
      .take(500);
    const lifetimeEarned = ledger.reduce(
      (sum, e) => (e.delta > 0 ? sum + e.delta : sum),
      0,
    );

    const allHabits = await ctx.db
      .query('habits')
      .withIndex('by_owner', (q) => q.eq('ownerId', user._id))
      .collect();
    const activeHabits = allHabits.filter((h) => !h.archived);

    const habits: EnrichedHabit[] = [];
    const dueHabitIds: Id<'habits'>[] = [];
    let bestCurrentStreak = 0;
    let longestStreak = 0;

    for (const h of activeHabits) {
      const streak = await ctx.db
        .query('streaks')
        .withIndex('by_user_habit', (q) =>
          q.eq('userId', user._id).eq('habitId', h._id),
        )
        .unique();
      const current = streak?.current ?? 0;
      const longest = streak?.longest ?? 0;

      const completion = await ctx.db
        .query('habitCompletions')
        .withIndex('by_user_habit_date', (q) =>
          q.eq('userId', user._id).eq('habitId', h._id).eq('localDate', localDate),
        )
        .unique();

      habits.push({ ...h, current, longest, doneToday: completion !== null });

      if (h.cadence.kind === 'daily' || h.cadence.days.includes(weekday)) {
        dueHabitIds.push(h._id);
      }
      if (current > bestCurrentStreak) bestCurrentStreak = current;
      if (longest > longestStreak) longestStreak = longest;
    }

    // Recent completions (V1-bounded to 1000) for totals + the progress chart.
    const completions = await ctx.db
      .query('habitCompletions')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .take(1000);
    const recentCompletionDates = Array.from(
      new Set(completions.map((c) => c.localDate)),
    );

    return {
      profile: {
        name: user.name,
        avatarColor: user.avatarColor ?? DEFAULT_AVATAR_COLOR,
        onboarded: user.onboarded ?? false,
      },
      points,
      lifetimeEarned,
      habits,
      dueHabitIds,
      totalCompletions: completions.length,
      bestCurrentStreak,
      longestStreak,
      recentCompletionDates,
    };
  },
});

/** Points ledger for the history screen. V1-bounded to the latest 100 entries. */
export const ledger = query({
  args: {},
  handler: async (ctx) => {
    const { user } = await findUser(ctx);
    if (!user) return [];
    const entries = await ctx.db
      .query('pointsLedger')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .order('desc')
      .take(100);
    return entries.map((e) => ({
      id: e._id,
      delta: e.delta,
      type: e.type,
      source: e.source,
      balanceAfter: e.balanceAfter,
      createdAt: e.createdAt,
    }));
  },
});
