import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { getOrCreateUser, requireUser } from './lib/users';

const cadenceValidator = v.union(
  v.object({ kind: v.literal('daily') }),
  v.object({ kind: v.literal('weekly'), days: v.array(v.number()) }),
);

const categoryValidator = v.union(
  v.literal('Health'),
  v.literal('Movement'),
  v.literal('Mind'),
  v.literal('Growth'),
  v.literal('Custom'),
);

/** All non-archived habits owned by the current user. */
export const listForUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const habits = await ctx.db
      .query('habits')
      .withIndex('by_owner', (q) => q.eq('ownerId', user._id))
      .collect();
    return habits.filter((h) => !h.archived);
  },
});

/**
 * Habits due today, given the user's local weekday (0=Sun..6=Sat).
 * The client passes `weekday` computed in its tz so the server stays tz-agnostic.
 */
export const dueToday = query({
  args: { weekday: v.number() },
  handler: async (ctx, { weekday }) => {
    const user = await requireUser(ctx);
    const habits = await ctx.db
      .query('habits')
      .withIndex('by_owner', (q) => q.eq('ownerId', user._id))
      .collect();

    return habits.filter((h) => {
      if (h.archived) return false;
      if (h.cadence.kind === 'daily') return true;
      return h.cadence.days.includes(weekday);
    });
  },
});

/** Create a custom habit for the current user. */
export const addCustom = mutation({
  args: {
    name: v.string(),
    icon: v.string(),
    category: categoryValidator,
    cadence: cadenceValidator,
    proofRequired: v.boolean(),
    pointValue: v.optional(v.number()),
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx, { timezone: args.timezone });
    const now = Date.now();
    const habitId = await ctx.db.insert('habits', {
      ownerId: user._id,
      name: args.name,
      icon: args.icon,
      category: args.category,
      cadence: args.cadence,
      proofRequired: args.proofRequired,
      isCustom: true,
      source: 'custom',
      pointValue: args.pointValue ?? 10,
      archived: false,
      createdAt: now,
    });

    // Initialize the streak + pause rows so completion never has to backfill.
    await ctx.db.insert('streaks', {
      userId: user._id,
      habitId,
      current: 0,
      longest: 0,
      lastCompletedDate: null,
    });
    await ctx.db.insert('streakPauses', {
      userId: user._id,
      habitId,
      usedOn: null,
      remaining: 0,
    });

    return await ctx.db.get(habitId);
  },
});

/** Archive (soft-delete) a habit. Owner-only. */
export const archive = mutation({
  args: { habitId: v.id('habits') },
  handler: async (ctx, { habitId }) => {
    const user = await getOrCreateUser(ctx);
    const habit = await ctx.db.get(habitId);
    if (!habit) throw new Error('Habit not found');
    if (habit.ownerId !== user._id) throw new Error('Not your habit');
    await ctx.db.patch(habitId, { archived: true });
    return { archived: true };
  },
});
