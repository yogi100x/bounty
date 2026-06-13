// Bounty — Convex schema (PRE-DEPLOYMENT CODE).
//
// IMPORTANT: This file is authored before `npx convex dev` has ever been run,
// so `convex/_generated/` does not exist yet. That means imports of
// `./_generated/server` etc. will not typecheck until the codegen step runs.
// This is expected and intentional — the code is written to be idiomatic and
// internally consistent so it compiles cleanly once `convex dev` generates the
// `_generated` folder. Do not "fix" the missing `_generated` imports by hand.
//
// Data model mirrors docs/IMPLEMENTATION-PLAN.md §2 and the shared app domain
// types in src/lib/types.ts. Every table that V1 needs is defined now —
// including fast-follow tables — so the app ships without migrations later.

import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

// Cadence mirrors src/lib/types.ts `Cadence`.
const cadence = v.union(
  v.object({ kind: v.literal('daily') }),
  v.object({ kind: v.literal('weekly'), days: v.array(v.number()) }), // 0=Sun..6=Sat
);

export default defineSchema({
  // ── Core (V1) ─────────────────────────────────────────────────────────────

  users: defineTable({
    clerkId: v.string(), // Clerk subject (ctx.auth.getUserIdentity().subject)
    name: v.string(),
    avatarRef: v.optional(v.string()), // storageId or preset key
    timezone: v.string(), // IANA tz, e.g. "America/New_York"
    createdAt: v.number(),
    // Profile/onboarding additions (optional so existing rows stay valid).
    notifyTime: v.optional(v.string()), // HH:mm daily nudge
    avatarColor: v.optional(v.string()), // hex preset, e.g. '#8B5CF6'
    onboarded: v.optional(v.boolean()),
  }).index('by_clerk_id', ['clerkId']),

  habits: defineTable({
    ownerId: v.id('users'),
    name: v.string(),
    icon: v.string(), // Feather icon name
    category: v.union(
      v.literal('Health'),
      v.literal('Movement'),
      v.literal('Mind'),
      v.literal('Growth'),
      v.literal('Custom'),
    ),
    cadence,
    proofRequired: v.boolean(),
    isCustom: v.boolean(),
    source: v.union(v.literal('library'), v.literal('custom')),
    sourceId: v.optional(v.string()), // library catalog id (for dedupe on import)
    pointValue: v.number(), // BASE points for this habit
    archived: v.boolean(),
    createdAt: v.number(),
  }).index('by_owner', ['ownerId']),

  habitCompletions: defineTable({
    userId: v.id('users'),
    habitId: v.id('habits'),
    localDate: v.string(), // YYYY-MM-DD in the user's tz at completion time
    proofId: v.optional(v.id('proofs')),
    source: v.union(v.literal('manual'), v.literal('bereal')),
    onTime: v.boolean(),
    createdAt: v.number(),
  })
    // Uniqueness story for (userId, habitId, localDate): Convex has no DB-level
    // unique constraint, so idempotency is enforced in the `completeHabit`
    // mutation by looking up this index first and short-circuiting if a row
    // for today already exists (mutations are transactional & serialized per
    // document set, so the check-then-insert is race-free).
    .index('by_user_habit_date', ['userId', 'habitId', 'localDate'])
    .index('by_user', ['userId'])
    .index('by_user_habit', ['userId', 'habitId']),

  proofs: defineTable({
    userId: v.id('users'),
    habitId: v.id('habits'),
    completionId: v.optional(v.id('habitCompletions')), // set after completion row exists
    photoStorageId: v.string(), // Convex storage id of the uploaded photo
    caption: v.optional(v.string()),
    visibility: v.union(v.literal('circle'), v.literal('private')),
    createdAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_completion', ['completionId']),

  circles: defineTable({
    name: v.string(),
    visibility: v.union(v.literal('public'), v.literal('private')),
    inviteCode: v.string(),
    memberCount: v.number(), // denormalized, capped at 6
    createdBy: v.id('users'),
    createdAt: v.number(),
  })
    .index('by_invite_code', ['inviteCode'])
    .index('by_visibility', ['visibility']),

  circleMembers: defineTable({
    circleId: v.id('circles'),
    userId: v.id('users'),
    role: v.union(v.literal('owner'), v.literal('member')),
    joinedAt: v.number(),
  })
    .index('by_circle', ['circleId'])
    .index('by_user', ['userId'])
    .index('by_circle_user', ['circleId', 'userId']),

  streaks: defineTable({
    userId: v.id('users'),
    habitId: v.id('habits'),
    current: v.number(),
    longest: v.number(),
    lastCompletedDate: v.union(v.string(), v.null()), // YYYY-MM-DD
  })
    .index('by_user', ['userId'])
    .index('by_user_habit', ['userId', 'habitId']),

  pointsLedger: defineTable({
    userId: v.id('users'),
    delta: v.number(), // positive for earn, negative for spend
    type: v.union(v.literal('earn'), v.literal('spend')),
    source: v.string(), // e.g. "completion", "proof_bonus", "milestone", "redemption"
    refId: v.optional(v.string()), // id of the related doc (completion, redemption, ...)
    balanceAfter: v.number(), // running balance after applying delta
    createdAt: v.number(),
  }).index('by_user', ['userId']),

  badges: defineTable({
    key: v.string(), // stable identifier, e.g. "streak_7"
    name: v.string(),
    description: v.string(),
    icon: v.string(),
  }).index('by_key', ['key']),

  userBadges: defineTable({
    userId: v.id('users'),
    badgeId: v.id('badges'),
    awardedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_badge', ['userId', 'badgeId']),

  rewards: defineTable({
    item: v.string(),
    description: v.optional(v.string()),
    // Catalog/UI fields (optional so existing rows stay valid). The seeded V1
    // catalog mirrors src/data/rewards.ts which uses title/icon/blurb.
    title: v.optional(v.string()),
    icon: v.optional(v.string()),
    blurb: v.optional(v.string()),
    cost: v.number(), // points required
    stock: v.number(), // remaining stock; decremented on redemption
    type: v.union(v.literal('brand'), v.literal('cause')),
    active: v.boolean(),
    createdAt: v.number(),
  }).index('by_active', ['active']),

  redemptions: defineTable({
    userId: v.id('users'),
    rewardId: v.id('rewards'),
    cost: v.number(), // points spent (snapshot of reward cost at redemption)
    status: v.union(
      v.literal('pending'),
      v.literal('fulfilled'),
      v.literal('cancelled'),
    ),
    createdAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_reward', ['rewardId']),

  // ── Pre-wired in Phase 1, populated by later features ──────────────────────

  streakPauses: defineTable({
    userId: v.id('users'),
    habitId: v.id('habits'),
    usedOn: v.union(v.string(), v.null()), // YYYY-MM-DD the pause was consumed, or null
    remaining: v.number(), // mercy/freeze allowance left
  })
    .index('by_user', ['userId'])
    .index('by_user_habit', ['userId', 'habitId']),

  notificationPrefs: defineTable({
    userId: v.id('users'),
    dailyNudgeTime: v.optional(v.string()), // HH:mm
    berealEnabled: v.boolean(),
    streakAtRisk: v.boolean(),
    circleActivity: v.boolean(),
    quietHours: v.optional(
      v.object({ start: v.string(), end: v.string() }), // HH:mm..HH:mm
    ),
  }).index('by_user', ['userId']),

  circleEvents: defineTable({
    circleId: v.id('circles'),
    actorId: v.id('users'),
    type: v.union(
      v.literal('proof'),
      v.literal('cheer'),
      v.literal('joined'),
      v.literal('milestone'),
    ),
    refId: v.optional(v.string()),
    // Denormalized feed-render fields (optional so existing rows stay valid).
    habitName: v.optional(v.string()),
    caption: v.optional(v.string()),
    streak: v.optional(v.number()),
    photoStorageId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index('by_circle', ['circleId'])
    .index('by_actor', ['actorId']),

  // Cheers on a circle event — one row per (event, user). Toggled via
  // circles.cheer; feed reads count via by_event and membership via
  // by_event_user.
  cheers: defineTable({
    circleEventId: v.id('circleEvents'),
    userId: v.id('users'),
    createdAt: v.number(),
  })
    .index('by_event', ['circleEventId'])
    .index('by_event_user', ['circleEventId', 'userId']),

  milestones: defineTable({
    userId: v.id('users'),
    type: v.string(), // e.g. "streak"
    value: v.number(), // e.g. 7, 30, 100
    refId: v.optional(v.string()), // related habit/completion id
    achievedAt: v.number(),
  }).index('by_user', ['userId']),
});
