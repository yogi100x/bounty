import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { getOrCreateUser, requireUser } from './lib/users';
import type { Id } from './_generated/dataModel';

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
      // Starter mercy allotment so a single missed day doesn't kill a streak.
      // TODO(P-later): replenish monthly (e.g. 2/month) via a cron.
      remaining: 2,
    });

    return await ctx.db.get(habitId);
  },
});

/**
 * Add one or more habits from the curated library for the current user.
 * Mirrors addCustom's side-table setup (streaks + streakPauses) per habit.
 * Dedupes by `sourceId`: any library habit the user already owns is skipped.
 */
export const addFromLibrary = mutation({
  args: {
    habits: v.array(
      v.object({
        name: v.string(),
        icon: v.string(),
        category: categoryValidator,
        cadence: cadenceValidator,
        proofRequired: v.boolean(),
        pointValue: v.number(),
        sourceId: v.string(),
      }),
    ),
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx, { timezone: args.timezone });
    const now = Date.now();

    // Dedupe against habits the user already owns. There is no by_owner_source
    // index, so we do a bounded scan of the user's habits via by_owner — fine
    // for V1 (a user's habit list is small).
    const existing = await ctx.db
      .query('habits')
      .withIndex('by_owner', (q) => q.eq('ownerId', user._id))
      .take(500);
    const ownedSourceIds = new Set(
      existing.map((h) => h.sourceId).filter((s): s is string => !!s),
    );

    const createdIds: Id<'habits'>[] = [];
    for (const h of args.habits) {
      if (ownedSourceIds.has(h.sourceId)) continue;
      ownedSourceIds.add(h.sourceId); // guard against dupes within this batch too

      const habitId = await ctx.db.insert('habits', {
        ownerId: user._id,
        name: h.name,
        icon: h.icon,
        category: h.category,
        cadence: h.cadence,
        proofRequired: h.proofRequired,
        isCustom: false,
        source: 'library',
        sourceId: h.sourceId,
        pointValue: h.pointValue,
        archived: false,
        createdAt: now,
      });

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
        // Starter mercy allotment (see addCustom).
        remaining: 2,
      });

      createdIds.push(habitId);
    }

    return createdIds;
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
