// Circles — groundwork for P3. Cap is ≤6 members, enforced via the denormalized
// memberCount on the circle. Membership writes emit circleEvents for the feed.

import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { getOrCreateUser, requireUser } from './lib/users';

const MAX_MEMBERS = 6;

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
