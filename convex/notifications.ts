// Push-notification delivery backend.
//
// Runtime: DEFAULT Convex runtime only. `fetch()` works here without
// `"use node";`, so the Expo Push API call lives in an `internalAction` in this
// same file alongside the queries/mutations (no Node runtime needed).
//
// Architecture (per Convex guidelines — actions have NO ctx.db access):
//   • Time-based nudges: a 15-min cron calls `runDueNudges` (action). The action
//     does the DB matching via an internal QUERY (`dueNudgeTargets`) and then
//     fans the resulting {token,title,body} list out through `sendPush`.
//   • Event-driven circle activity: mutations in circles.ts / completions.ts
//     gather tokens (DB reads are fine in a mutation) and schedule `sendPush`
//     via `ctx.scheduler.runAfter(0, ...)` — they never `fetch` inline.

import { v } from 'convex/values';
import {
  query,
  mutation,
  internalQuery,
  internalAction,
} from './_generated/server';
import { internal } from './_generated/api';
import { getOrCreateUser, requireUser } from './lib/users';

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';
const EXPO_CHUNK_SIZE = 100; // Expo accepts up to 100 messages per request.

// V1 scan bound: number of users considered per nudge sweep. Revisit when the
// user base outgrows a single bounded read.
const USER_SCAN_LIMIT = 1000;

// Defaults returned by getPrefs when the user has no notificationPrefs row yet.
// Mirrors the quiet-by-default provisioning in getOrCreateUser.
const DEFAULT_PREFS = {
  dailyNudgeTime: null as string | null,
  berealEnabled: false,
  streakAtRisk: true,
  circleActivity: true,
  quietHours: null as { start: string; end: string } | null,
};

// ── Token + prefs management ──────────────────────────────────────────────

/** Persist the caller's Expo push token on their users row. */
export const savePushToken = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const user = await getOrCreateUser(ctx);
    await ctx.db.patch(user._id, { pushToken: token });
    return { ok: true };
  },
});

/**
 * The current user's notification preferences, or sensible defaults when no
 * row exists. Used by the settings screen. Read-only (no provisioning).
 */
export const getPrefs = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const prefs = await ctx.db
      .query('notificationPrefs')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .unique();
    if (!prefs) return DEFAULT_PREFS;
    return {
      dailyNudgeTime: prefs.dailyNudgeTime ?? null,
      berealEnabled: prefs.berealEnabled,
      streakAtRisk: prefs.streakAtRisk,
      circleActivity: prefs.circleActivity,
      quietHours: prefs.quietHours ?? null,
    };
  },
});

/**
 * Patch the current user's notificationPrefs. Only provided fields change;
 * creates the row (with defaults) if it doesn't exist yet.
 */
export const updatePrefs = mutation({
  args: {
    dailyNudgeTime: v.optional(v.union(v.string(), v.null())),
    berealEnabled: v.optional(v.boolean()),
    streakAtRisk: v.optional(v.boolean()),
    circleActivity: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx);
    const existing = await ctx.db
      .query('notificationPrefs')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .unique();

    // dailyNudgeTime: null clears it; undefined leaves it untouched.
    const dailyNudgeTime =
      args.dailyNudgeTime === undefined
        ? undefined
        : args.dailyNudgeTime ?? undefined;

    if (!existing) {
      await ctx.db.insert('notificationPrefs', {
        userId: user._id,
        dailyNudgeTime,
        berealEnabled: args.berealEnabled ?? false,
        streakAtRisk: args.streakAtRisk ?? true,
        circleActivity: args.circleActivity ?? true,
        quietHours: undefined,
      });
      return { ok: true };
    }

    const patch: {
      dailyNudgeTime?: string | undefined;
      berealEnabled?: boolean;
      streakAtRisk?: boolean;
      circleActivity?: boolean;
    } = {};
    if (args.dailyNudgeTime !== undefined) patch.dailyNudgeTime = dailyNudgeTime;
    if (args.berealEnabled !== undefined) patch.berealEnabled = args.berealEnabled;
    if (args.streakAtRisk !== undefined) patch.streakAtRisk = args.streakAtRisk;
    if (args.circleActivity !== undefined)
      patch.circleActivity = args.circleActivity;

    await ctx.db.patch(existing._id, patch);
    return { ok: true };
  },
});

// ── Expo Push API delivery (internal action) ───────────────────────────────

type ExpoMessage = {
  to: string;
  title: string;
  body: string;
  sound: 'default';
  data?: unknown;
};

/**
 * POST a batch of push messages to the Expo Push API, chunked at 100 messages
 * per request. Best-effort: empty/falsey tokens are filtered out, and any
 * network/API failure is caught and logged — this NEVER throws.
 */
export const sendPush = internalAction({
  args: {
    tokens: v.array(v.string()),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (_ctx, { tokens, title, body, data }) => {
    const valid = tokens.filter((t): t is string => !!t);
    if (valid.length === 0) return { sent: 0 };

    const messages: ExpoMessage[] = valid.map((to) => ({
      to,
      title,
      body,
      sound: 'default',
      ...(data !== undefined ? { data } : {}),
    }));

    let sent = 0;
    for (let i = 0; i < messages.length; i += EXPO_CHUNK_SIZE) {
      const chunk = messages.slice(i, i + EXPO_CHUNK_SIZE);
      try {
        const res = await fetch(EXPO_PUSH_ENDPOINT, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Accept-Encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(chunk),
        });
        if (!res.ok) {
          const text = await res.text().catch(() => '<no body>');
          console.error(
            `sendPush: Expo API returned ${res.status} for chunk of ${chunk.length}: ${text}`,
          );
          continue;
        }
        sent += chunk.length;
      } catch (err) {
        console.error('sendPush: failed to deliver chunk', err);
        // Swallow — best-effort delivery, never throw.
      }
    }
    return { sent };
  },
});

// ── Time-based nudge matching (internal query) ─────────────────────────────

type NudgeTarget = { token: string; title: string; body: string };

/**
 * Format the local "now" for an IANA timezone as { hour, minute, date }.
 * `date` is the local YYYY-MM-DD, used to detect "completed today".
 */
function localNow(
  nowUtc: number,
  timezone: string,
): { hour: number; minute: number; date: string } {
  const d = new Date(nowUtc);
  // HH:mm in 24h for the matching window.
  const hm = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
  // Normalize the "24:xx" edge some runtimes emit for midnight.
  const [hRaw, mRaw] = hm.split(':');
  const hour = Number(hRaw) % 24;
  const minute = Number(mRaw);

  // YYYY-MM-DD in the same tz.
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
  const date = parts; // en-CA yields YYYY-MM-DD

  return { hour, minute, date };
}

/** Parse "HH:mm" into minutes-since-midnight, or null if malformed. */
function parseHmToMinutes(hm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hm.trim());
  if (!m) return null;
  const hours = Number(m[1]);
  const mins = Number(m[2]);
  if (hours < 0 || hours > 23 || mins < 0 || mins > 59) return null;
  return hours * 60 + mins;
}

/**
 * Build the list of due push targets at `nowUtc`. ALL db access happens here
 * (this is a query); the calling action only fans out `sendPush`.
 *
 * Two nudge types:
 *   • Daily nudge — prefs.dailyNudgeTime set, local time within the last 15-min
 *     window ending at that time, user has ≥1 habit and no completion today.
 *   • Streak at risk — prefs.streakAtRisk, local hour === 20 (evening), the user
 *     has a habit with current streak > 0 not yet completed today.
 *
 * All scans are bounded.
 */
export const dueNudgeTargets = internalQuery({
  args: { nowUtc: v.number() },
  handler: async (ctx, { nowUtc }): Promise<NudgeTarget[]> => {
    // V1 bound: consider the first USER_SCAN_LIMIT users. Pagination is a
    // fast-follow when the base outgrows a single bounded read.
    const users = await ctx.db.query('users').take(USER_SCAN_LIMIT);

    const targets: NudgeTarget[] = [];

    for (const user of users) {
      const token = user.pushToken;
      if (!token) continue;

      const prefs = await ctx.db
        .query('notificationPrefs')
        .withIndex('by_user', (q) => q.eq('userId', user._id))
        .unique();
      if (!prefs) continue;

      const tz = user.timezone || 'UTC';
      let local: { hour: number; minute: number; date: string };
      try {
        local = localNow(nowUtc, tz);
      } catch {
        // Invalid timezone string — skip this user defensively.
        continue;
      }
      const nowMinutes = local.hour * 60 + local.minute;

      // The user's active (non-archived) habits — bounded read.
      const habits = await ctx.db
        .query('habits')
        .withIndex('by_owner', (q) => q.eq('ownerId', user._id))
        .take(100);
      const activeHabits = habits.filter((h) => !h.archived);

      // Helper: has the user completed a given habit today (their local date)?
      const completedToday = async (habitId: typeof activeHabits[number]['_id']) => {
        const c = await ctx.db
          .query('habitCompletions')
          .withIndex('by_user_habit_date', (q) =>
            q
              .eq('userId', user._id)
              .eq('habitId', habitId)
              .eq('localDate', local.date),
          )
          .unique();
        return c !== null;
      };

      // ── Daily nudge ──────────────────────────────────────────────────────
      if (prefs.dailyNudgeTime) {
        const target = parseHmToMinutes(prefs.dailyNudgeTime);
        if (target !== null) {
          // Fire when now is within the last 15 minutes window ending at the
          // target time: target-15 < now <= target.
          const inWindow = nowMinutes > target - 15 && nowMinutes <= target;
          if (inWindow && activeHabits.length > 0) {
            // Approximation: incomplete if ANY active habit lacks a completion
            // today.
            let anyIncomplete = false;
            for (const h of activeHabits) {
              if (!(await completedToday(h._id))) {
                anyIncomplete = true;
                break;
              }
            }
            if (anyIncomplete) {
              targets.push({
                token,
                title: 'Time to show up',
                body: 'Your streak is waiting.',
              });
            }
          }
        }
      }

      // ── Streak at risk (evening) ───────────────────────────────────────────
      if (prefs.streakAtRisk && local.hour === 20) {
        let atRisk = false;
        for (const h of activeHabits) {
          const streak = await ctx.db
            .query('streaks')
            .withIndex('by_user_habit', (q) =>
              q.eq('userId', user._id).eq('habitId', h._id),
            )
            .unique();
          if ((streak?.current ?? 0) > 0 && !(await completedToday(h._id))) {
            atRisk = true;
            break;
          }
        }
        if (atRisk) {
          targets.push({
            token,
            title: "Don't break your streak",
            body: "You've come too far to stop now — a few minutes keeps it alive.",
          });
        }
      }
    }

    return targets;
  },
});

/**
 * Cron target (every 15 min). Loads due nudge targets via the internal query
 * (DB access lives there), then fans each out through `sendPush`. Best-effort.
 */
export const runDueNudges = internalAction({
  args: {},
  handler: async (ctx): Promise<{ queued: number }> => {
    const targets: NudgeTarget[] = await ctx.runQuery(
      internal.notifications.dueNudgeTargets,
      { nowUtc: Date.now() },
    );

    for (const t of targets) {
      await ctx.scheduler.runAfter(0, internal.notifications.sendPush, {
        tokens: [t.token],
        title: t.title,
        body: t.body,
      });
    }

    return { queued: targets.length };
  },
});
