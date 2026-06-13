// Identity helpers. Every mutation derives the acting user from the Clerk
// identity on `ctx.auth`, never from a client-supplied userId.

import type { MutationCtx, QueryCtx } from '../_generated/server';
import type { Doc, Id } from '../_generated/dataModel';

/**
 * Resolve the current Clerk identity to a `users` row, creating it on first
 * sign-in. Used by mutations (read+write context required).
 *
 * The Clerk subject is stored as `clerkId`; we look it up via the
 * `by_clerk_id` index. On first call we provision the user plus their starting
 * side-tables (notificationPrefs) so later features never have to backfill.
 */
export async function getOrCreateUser(
  ctx: MutationCtx,
  opts?: { timezone?: string },
): Promise<Doc<'users'>> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error('Not authenticated');
  }

  const existing = await ctx.db
    .query('users')
    .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
    .unique();

  if (existing) {
    // Keep timezone fresh if the client reports a new one.
    if (opts?.timezone && opts.timezone !== existing.timezone) {
      await ctx.db.patch(existing._id, { timezone: opts.timezone });
      return { ...existing, timezone: opts.timezone };
    }
    return existing;
  }

  const now = Date.now();
  const userId = await ctx.db.insert('users', {
    clerkId: identity.subject,
    name: identity.name ?? identity.givenName ?? 'Bounty user',
    avatarRef: identity.pictureUrl ?? undefined,
    timezone: opts?.timezone ?? 'UTC',
    createdAt: now,
  });

  // Provision sensible default notification prefs (quiet-by-default).
  await ctx.db.insert('notificationPrefs', {
    userId,
    dailyNudgeTime: undefined,
    berealEnabled: false,
    streakAtRisk: true,
    circleActivity: true,
    quietHours: undefined,
  });

  const created = await ctx.db.get(userId);
  if (!created) throw new Error('Failed to create user');
  return created;
}

/**
 * Read-only variant: resolve the current user or throw. Does NOT create.
 * Use in queries (no write capability).
 */
export async function requireUser(ctx: QueryCtx): Promise<Doc<'users'>> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error('Not authenticated');
  }
  const user = await ctx.db
    .query('users')
    .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
    .unique();
  if (!user) {
    throw new Error('User not provisioned — call a mutation first');
  }
  return user;
}

/** Current points balance = balanceAfter of the most recent ledger entry. */
export async function currentBalance(
  ctx: QueryCtx | MutationCtx,
  userId: Id<'users'>,
): Promise<number> {
  const last = await ctx.db
    .query('pointsLedger')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .order('desc')
    .first();
  return last?.balanceAfter ?? 0;
}
