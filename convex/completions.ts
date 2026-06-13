// The first-win loop. `completeHabit` is the highest-risk mutation — it must be
// idempotent (once-per-local-day) and atomic across completion + proof + streak
// + ledger + milestone + circleEvent. Convex mutations are transactional and
// serialized over the documents they touch, so the read-then-write sequence
// below is race-free: a double-submit hits the by_user_habit_date index, sees
// the existing row, and returns it WITHOUT crediting points again.

import { mutation } from './_generated/server';
import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';
import { internal } from './_generated/api';
import { getOrCreateUser, currentBalance } from './lib/users';
import { computeNextStreak } from './lib/streak';
import { computePoints } from './points';

// Shape mirrors src/lib/types.ts `AwardResult`.
type AwardResult = {
  habitId: string;
  habitName: string;
  alreadyDone: boolean;
  basePoints: number;
  proofBonus: number;
  milestoneBonus: number;
  pointsEarned: number;
  newStreak: number;
  isMilestone: boolean;
  milestoneValue?: number;
};

export const completeHabit = mutation({
  args: {
    habitId: v.id('habits'),
    // Client computes these in the user's tz — the server stays tz-agnostic.
    localDate: v.string(), // YYYY-MM-DD "today"
    yesterdayISO: v.string(), // YYYY-MM-DD "yesterday"
    timezone: v.optional(v.string()),
    source: v.optional(v.union(v.literal('manual'), v.literal('bereal'))),
    onTime: v.optional(v.boolean()), // for BeReal: captured inside the window
    // Optional proof attached at completion time.
    proof: v.optional(
      v.object({
        photoStorageId: v.string(),
        caption: v.optional(v.string()),
        visibility: v.optional(v.union(v.literal('circle'), v.literal('private'))),
      }),
    ),
  },
  handler: async (ctx, args): Promise<AwardResult> => {
    const user = await getOrCreateUser(ctx, { timezone: args.timezone });

    const habit = await ctx.db.get(args.habitId);
    if (!habit) throw new Error('Habit not found');
    if (habit.ownerId !== user._id) throw new Error('Not your habit');

    const source = args.source ?? 'manual';
    const onTime = args.onTime ?? source === 'manual'; // manual is always "on time"

    // ── Idempotency guard ──────────────────────────────────────────────────
    // If a completion already exists for (user, habit, localDate), return it
    // without crediting points again.
    const existing = await ctx.db
      .query('habitCompletions')
      .withIndex('by_user_habit_date', (q) =>
        q
          .eq('userId', user._id)
          .eq('habitId', args.habitId)
          .eq('localDate', args.localDate),
      )
      .unique();

    const streak = await ctx.db
      .query('streaks')
      .withIndex('by_user_habit', (q) =>
        q.eq('userId', user._id).eq('habitId', args.habitId),
      )
      .unique();

    if (existing) {
      return {
        habitId: args.habitId,
        habitName: habit.name,
        alreadyDone: true,
        basePoints: 0,
        proofBonus: 0,
        milestoneBonus: 0,
        pointsEarned: 0,
        newStreak: streak?.current ?? 0,
        isMilestone: false,
      };
    }

    // ── Streak update (pure engine) ────────────────────────────────────────
    const pause = await ctx.db
      .query('streakPauses')
      .withIndex('by_user_habit', (q) =>
        q.eq('userId', user._id).eq('habitId', args.habitId),
      )
      .unique();
    const hasPause = (pause?.remaining ?? 0) > 0;

    const next = computeNextStreak({
      lastCompletedDate: streak?.lastCompletedDate ?? null,
      current: streak?.current ?? 0,
      longest: streak?.longest ?? 0,
      todayISO: args.localDate,
      yesterdayISO: args.yesterdayISO,
      hasPause,
    });

    // ── Insert completion (+ proof) ────────────────────────────────────────
    const now = Date.now();
    const hasProof = !!args.proof;

    const completionId = await ctx.db.insert('habitCompletions', {
      userId: user._id,
      habitId: args.habitId,
      localDate: args.localDate,
      source,
      onTime,
      createdAt: now,
    });

    // refId on circleEvents is a string in the schema, so we keep the proof id
    // as a string for the feed event below.
    let proofRefId: string | undefined;
    if (args.proof) {
      const pid = await ctx.db.insert('proofs', {
        userId: user._id,
        habitId: args.habitId,
        completionId,
        photoStorageId: args.proof.photoStorageId,
        caption: args.proof.caption,
        visibility: args.proof.visibility ?? 'private',
        createdAt: now,
      });
      proofRefId = pid;
      await ctx.db.patch(completionId, { proofId: pid });
    }

    // Persist streak (create if missing) and consume a pause if used.
    if (streak) {
      await ctx.db.patch(streak._id, {
        current: next.current,
        longest: next.longest,
        lastCompletedDate: next.lastCompletedDate,
      });
    } else {
      await ctx.db.insert('streaks', {
        userId: user._id,
        habitId: args.habitId,
        current: next.current,
        longest: next.longest,
        lastCompletedDate: next.lastCompletedDate,
      });
    }
    if (next.pauseConsumed && pause) {
      await ctx.db.patch(pause._id, {
        remaining: Math.max(0, pause.remaining - 1),
        usedOn: args.localDate,
      });
    }

    // ── Points + ledger (append-only, with running balanceAfter) ───────────
    const points = computePoints({
      basePoints: habit.pointValue,
      hasProof,
      onTimeBeReal: source === 'bereal' && onTime,
      newStreak: next.current,
    });

    const balanceBefore = await currentBalance(ctx, user._id);
    const balanceAfter = balanceBefore + points.total;

    await ctx.db.insert('pointsLedger', {
      userId: user._id,
      delta: points.total,
      type: 'earn',
      source: hasProof ? 'completion+proof' : 'completion',
      refId: completionId,
      balanceAfter,
      createdAt: now,
    });

    // ── Milestone + circle event when a threshold is crossed ───────────────
    const isMilestone = points.milestoneValue !== undefined;
    if (isMilestone) {
      await ctx.db.insert('milestones', {
        userId: user._id,
        type: 'streak',
        value: points.milestoneValue!,
        refId: completionId,
        achievedAt: now,
      });

      // Emit a milestone event into every circle the user belongs to.
      const memberships = await ctx.db
        .query('circleMembers')
        .withIndex('by_user', (q) => q.eq('userId', user._id))
        .collect();
      for (const m of memberships) {
        await ctx.db.insert('circleEvents', {
          circleId: m.circleId,
          actorId: user._id,
          type: 'milestone',
          refId: completionId,
          habitName: habit.name,
          streak: next.current,
          createdAt: now,
        });
      }
    }

    // If the proof is shared to a circle, also emit a proof event.
    if (hasProof && args.proof?.visibility === 'circle') {
      const memberships = await ctx.db
        .query('circleMembers')
        .withIndex('by_user', (q) => q.eq('userId', user._id))
        .collect();
      for (const m of memberships) {
        await ctx.db.insert('circleEvents', {
          circleId: m.circleId,
          actorId: user._id,
          type: 'proof',
          refId: proofRefId,
          habitName: habit.name,
          caption: args.proof?.caption,
          streak: next.current,
          photoStorageId: args.proof?.photoStorageId,
          createdAt: now,
        });
      }
    }

    // ── Circle activity push (best-effort, bounded) ────────────────────────
    // If we emitted a milestone and/or shared-proof event into the user's
    // circles, notify the OTHER members whose circleActivity pref is on. We
    // gather tokens here (DB reads are fine in a mutation) and defer the
    // network call to the sendPush action via the scheduler.
    const sharedProof = hasProof && args.proof?.visibility === 'circle';
    if (isMilestone || sharedProof) {
      const memberships = await ctx.db
        .query('circleMembers')
        .withIndex('by_user', (q) => q.eq('userId', user._id))
        .take(20); // V1: a user is in few circles (≤6 members each).

      // Collect unique other-member user ids across all the user's circles.
      const otherUserIds = new Set<Id<'users'>>();
      for (const m of memberships) {
        const rows = await ctx.db
          .query('circleMembers')
          .withIndex('by_circle', (q) => q.eq('circleId', m.circleId))
          .take(6); // circle cap is 6 members
        for (const r of rows) {
          if (r.userId !== user._id) otherUserIds.add(r.userId);
        }
      }

      const tokens: string[] = [];
      for (const uid of otherUserIds) {
        const other = await ctx.db.get(uid);
        if (!other?.pushToken) continue;
        const prefs = await ctx.db
          .query('notificationPrefs')
          .withIndex('by_user', (q) => q.eq('userId', uid))
          .unique();
        if (prefs?.circleActivity) tokens.push(other.pushToken);
      }

      if (tokens.length > 0) {
        const title = isMilestone ? 'A milestone in your circle' : 'Circle activity';
        const body = isMilestone
          ? `${user.name} just hit a ${next.current}-day streak on ${habit.name}.`
          : `${user.name} just showed up.`;
        await ctx.scheduler.runAfter(0, internal.notifications.sendPush, {
          tokens,
          title,
          body,
          data: { type: isMilestone ? 'milestone' : 'proof' },
        });
      }
    }

    return {
      habitId: args.habitId,
      habitName: habit.name,
      alreadyDone: false,
      basePoints: points.basePoints,
      proofBonus: points.proofBonus + points.onTimeBonus,
      milestoneBonus: points.milestoneBonus,
      pointsEarned: points.total,
      newStreak: next.current,
      isMilestone,
      milestoneValue: points.milestoneValue,
    };
  },
});
