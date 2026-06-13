// Circles — groundwork for P3. Cap is ≤6 members, enforced via the denormalized
// memberCount on the circle. Membership writes emit circleEvents for the feed.

import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import type { Doc, Id } from './_generated/dataModel';
import { getOrCreateUser, requireUser } from './lib/users';

const MAX_MEMBERS = 6;

/** First two initials from a name (e.g. "Ada Lovelace" → "AL"). */
function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function generateInviteCode(): string {
  // 6-char uppercase alphanumeric, no ambiguous chars (0/O, 1/I).
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

/** Look up a circle by invite code (for the invite → join flow). */
export const byInviteCode = query({
  args: { inviteCode: v.string() },
  handler: async (ctx, { inviteCode }) => {
    const circle = await ctx.db
      .query('circles')
      .withIndex('by_invite_code', (q) => q.eq('inviteCode', inviteCode))
      .unique();
    return circle ?? null;
  },
});

/** Circles the current user belongs to. */
export const listForUser = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const memberships = await ctx.db
      .query('circleMembers')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect();
    const circles = await Promise.all(
      memberships.map((m) => ctx.db.get(m.circleId)),
    );
    return circles.filter((c): c is NonNullable<typeof c> => c !== null);
  },
});

/** Create a circle; creator becomes the owner member. */
export const create = mutation({
  args: {
    name: v.string(),
    visibility: v.union(v.literal('public'), v.literal('private')),
  },
  handler: async (ctx, { name, visibility }) => {
    const user = await getOrCreateUser(ctx);
    const now = Date.now();

    // Best-effort unique invite code (retry a few times on collision).
    let inviteCode = generateInviteCode();
    for (let i = 0; i < 5; i++) {
      const clash = await ctx.db
        .query('circles')
        .withIndex('by_invite_code', (q) => q.eq('inviteCode', inviteCode))
        .unique();
      if (!clash) break;
      inviteCode = generateInviteCode();
    }

    const circleId = await ctx.db.insert('circles', {
      name,
      visibility,
      inviteCode,
      memberCount: 1,
      createdBy: user._id,
      createdAt: now,
    });

    await ctx.db.insert('circleMembers', {
      circleId,
      userId: user._id,
      role: 'owner',
      joinedAt: now,
    });

    await ctx.db.insert('circleEvents', {
      circleId,
      actorId: user._id,
      type: 'joined',
      createdAt: now,
    });

    return await ctx.db.get(circleId);
  },
});

/** Join a circle by id (public discovery) — enforces the ≤6 cap. */
export const join = mutation({
  args: { circleId: v.id('circles') },
  handler: async (ctx, { circleId }) => {
    const user = await getOrCreateUser(ctx);
    const circle = await ctx.db.get(circleId);
    if (!circle) throw new Error('Circle not found');

    // Already a member? Idempotent no-op.
    const existing = await ctx.db
      .query('circleMembers')
      .withIndex('by_circle_user', (q) =>
        q.eq('circleId', circleId).eq('userId', user._id),
      )
      .unique();
    if (existing) return { joined: true, alreadyMember: true };

    if (circle.memberCount >= MAX_MEMBERS) {
      throw new Error('Circle is full');
    }

    const now = Date.now();
    await ctx.db.insert('circleMembers', {
      circleId,
      userId: user._id,
      role: 'member',
      joinedAt: now,
    });
    await ctx.db.patch(circleId, { memberCount: circle.memberCount + 1 });
    await ctx.db.insert('circleEvents', {
      circleId,
      actorId: user._id,
      type: 'joined',
      createdAt: now,
    });

    return { joined: true, alreadyMember: false };
  },
});

/** Join a circle via invite code (the invite → install → auto-join wedge). */
export const joinByCode = mutation({
  args: { inviteCode: v.string() },
  handler: async (ctx, { inviteCode }) => {
    const user = await getOrCreateUser(ctx);
    const circle = await ctx.db
      .query('circles')
      .withIndex('by_invite_code', (q) => q.eq('inviteCode', inviteCode))
      .unique();
    if (!circle) throw new Error('Invalid invite code');

    const existing = await ctx.db
      .query('circleMembers')
      .withIndex('by_circle_user', (q) =>
        q.eq('circleId', circle._id).eq('userId', user._id),
      )
      .unique();
    if (existing) return { joined: true, alreadyMember: true, circleId: circle._id };

    if (circle.memberCount >= MAX_MEMBERS) {
      throw new Error('Circle is full');
    }

    const now = Date.now();
    await ctx.db.insert('circleMembers', {
      circleId: circle._id,
      userId: user._id,
      role: 'member',
      joinedAt: now,
    });
    await ctx.db.patch(circle._id, { memberCount: circle.memberCount + 1 });
    await ctx.db.insert('circleEvents', {
      circleId: circle._id,
      actorId: user._id,
      type: 'joined',
      createdAt: now,
    });

    return { joined: true, alreadyMember: false, circleId: circle._id };
  },
});

/** Leave a circle. If the last member leaves, the circle is deleted. */
export const leave = mutation({
  args: { circleId: v.id('circles') },
  handler: async (ctx, { circleId }) => {
    const user = await getOrCreateUser(ctx);
    const circle = await ctx.db.get(circleId);
    if (!circle) throw new Error('Circle not found');

    const membership = await ctx.db
      .query('circleMembers')
      .withIndex('by_circle_user', (q) =>
        q.eq('circleId', circleId).eq('userId', user._id),
      )
      .unique();
    if (!membership) return { left: true, wasMember: false };

    await ctx.db.delete(membership._id);
    const nextCount = Math.max(0, circle.memberCount - 1);

    if (nextCount === 0) {
      await ctx.db.delete(circleId);
    } else {
      await ctx.db.patch(circleId, { memberCount: nextCount });
    }

    return { left: true, wasMember: true };
  },
});

/**
 * The current user's active circle (first membership) with members + feed,
 * shaped for the Circle screen. Returns null if the user is in no circle.
 */
export const current = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    // Active circle = the first circle the user belongs to. V1 caps the user
    // at one circle in practice; .first() keeps this bounded regardless.
    const membership = await ctx.db
      .query('circleMembers')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first();
    if (!membership) return null;

    const circle = await ctx.db.get(membership.circleId);
    if (!circle) return null;

    // Cache resolved user names so the feed doesn't re-fetch the same actor.
    const userCache = new Map<Id<'users'>, Doc<'users'> | null>();
    const resolveUser = async (
      id: Id<'users'>,
    ): Promise<Doc<'users'> | null> => {
      if (userCache.has(id)) return userCache.get(id) ?? null;
      const u = await ctx.db.get(id);
      userCache.set(id, u);
      return u;
    };

    // ── Members ─────────────────────────────────────────────────────────────
    // Bounded by MAX_MEMBERS (6); .take keeps it explicit if the cap ever grows.
    const memberRows = await ctx.db
      .query('circleMembers')
      .withIndex('by_circle', (q) => q.eq('circleId', circle._id))
      .take(MAX_MEMBERS);

    const members = await Promise.all(
      memberRows.map(async (m) => {
        const u = await resolveUser(m.userId);
        const name = u?.name ?? 'Bounty user';
        return {
          userId: m.userId,
          name,
          initials: initialsFor(name),
          role: m.role,
          isMe: m.userId === user._id,
        };
      }),
    );

    // ── Feed ────────────────────────────────────────────────────────────────
    // V1 feed bound: newest 100 events for this circle.
    const events = await ctx.db
      .query('circleEvents')
      .withIndex('by_circle', (q) => q.eq('circleId', circle._id))
      .order('desc')
      .take(100);

    const feed = await Promise.all(
      events.map(async (ev) => {
        const actor = await resolveUser(ev.actorId);
        const actorName = actor?.name ?? 'Bounty user';

        const photoUrl = ev.photoStorageId
          ? await ctx.storage.getUrl(ev.photoStorageId)
          : null;

        // V1 cheers bound: count up to 200 cheers per event (well above the
        // 6-member cap; the .take length is the displayed count).
        const cheerRows = await ctx.db
          .query('cheers')
          .withIndex('by_event', (q) => q.eq('circleEventId', ev._id))
          .take(200);

        const myCheer = await ctx.db
          .query('cheers')
          .withIndex('by_event_user', (q) =>
            q.eq('circleEventId', ev._id).eq('userId', user._id),
          )
          .unique();

        return {
          id: ev._id,
          type: ev.type,
          actorId: ev.actorId,
          actorName,
          actorInitials: initialsFor(actorName),
          habitName: ev.habitName,
          caption: ev.caption,
          streak: ev.streak,
          photoUrl,
          createdAt: ev.createdAt,
          cheers: cheerRows.length,
          cheeredByMe: myCheer !== null,
        };
      }),
    );

    return {
      circle: {
        _id: circle._id,
        name: circle.name,
        visibility: circle.visibility,
        inviteCode: circle.inviteCode,
        memberCount: circle.memberCount,
      },
      members,
      feed,
    };
  },
});

/**
 * Toggle a cheer on a circle event for the current user. Inserts a cheer row
 * if none exists, otherwise removes it. Returns the resulting cheered state.
 */
export const cheer = mutation({
  args: { circleEventId: v.id('circleEvents') },
  handler: async (ctx, { circleEventId }) => {
    const user = await getOrCreateUser(ctx);

    const existing = await ctx.db
      .query('cheers')
      .withIndex('by_event_user', (q) =>
        q.eq('circleEventId', circleEventId).eq('userId', user._id),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { cheered: false };
    }

    await ctx.db.insert('cheers', {
      circleEventId,
      userId: user._id,
      createdAt: Date.now(),
    });
    return { cheered: true };
  },
});
