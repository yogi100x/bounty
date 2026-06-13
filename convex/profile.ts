// Profile + onboarding mutations. Identity is always derived server-side via
// getOrCreateUser (never a client-supplied userId).

import { mutation } from './_generated/server';
import { v } from 'convex/values';
import { getOrCreateUser } from './lib/users';

/** Patch profile fields on the current user's row. Only provided fields change. */
export const setProfile = mutation({
  args: {
    name: v.optional(v.string()),
    avatarColor: v.optional(v.string()),
    notifyTime: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getOrCreateUser(ctx);
    const patch: {
      name?: string;
      avatarColor?: string;
      notifyTime?: string;
    } = {};
    if (args.name !== undefined) patch.name = args.name;
    if (args.avatarColor !== undefined) patch.avatarColor = args.avatarColor;
    if (args.notifyTime !== undefined) patch.notifyTime = args.notifyTime;
    await ctx.db.patch(user._id, patch);
    return { ok: true };
  },
});

/** Mark onboarding complete for the current user. */
export const completeOnboarding = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getOrCreateUser(ctx);
    await ctx.db.patch(user._id, { onboarded: true });
    return { ok: true };
  },
});
