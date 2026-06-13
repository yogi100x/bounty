// Marketplace. `redeemReward` must be atomic and oversell-proof: balance check
// + stock decrement + redemption record + ledger spend entry all happen in one
// transactional mutation. Convex serializes the mutation over the reward/ledger
// docs it touches, so two concurrent redemptions of the last unit cannot both
// succeed — the second sees stock === 0 (after the first commits) and rejects.

import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { getOrCreateUser, requireUser, currentBalance } from './lib/users';

// V1 reward catalog — mirrors src/data/rewards.ts. Seeded once via seedCatalog.
const REWARD_CATALOG = [
  { title: 'Plant a tree', cost: 150, type: 'cause' as const, icon: 'feather', stock: 999, blurb: 'We donate to reforestation in your name.' },
  { title: 'Donate a meal', cost: 200, type: 'cause' as const, icon: 'heart', stock: 999, blurb: 'Fund a meal for someone in need.' },
  { title: '$5 coffee card', cost: 500, type: 'brand' as const, icon: 'coffee', stock: 25, blurb: 'Treat yourself — you earned it.' },
  { title: 'Clean water day', cost: 350, type: 'cause' as const, icon: 'droplet', stock: 999, blurb: 'A day of clean water for a family.' },
  { title: '1 month music', cost: 1500, type: 'brand' as const, icon: 'headphones', stock: 10, blurb: 'A month of streaming, on us.' },
  { title: 'eBook of choice', cost: 1200, type: 'brand' as const, icon: 'book-open', stock: 15, blurb: 'Pick any title up to $15.' },
];

/**
 * Active reward catalog, shaped for the marketplace UI.
 * Returns the fields the RewardCard needs.
 */
export const listCatalog = query({
  args: {},
  handler: async (ctx) => {
    const rewards = await ctx.db
      .query('rewards')
      .withIndex('by_active', (q) => q.eq('active', true))
      .collect();
    return rewards.map((r) => ({
      _id: r._id,
      // Fall back to legacy `item`/`description` for any pre-catalog rows.
      title: r.title ?? r.item,
      cost: r.cost,
      type: r.type,
      icon: r.icon ?? 'gift',
      blurb: r.blurb ?? r.description ?? '',
      stock: r.stock,
    }));
  },
});

/**
 * Idempotently seed the V1 reward catalog. No-op if any reward already exists.
 * Called once by the parent after deploy.
 */
export const seedCatalog = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query('rewards').first();
    if (existing) return { seeded: false, count: 0 };

    const now = Date.now();
    for (const r of REWARD_CATALOG) {
      await ctx.db.insert('rewards', {
        // Keep legacy `item` in sync with `title` so older readers still work.
        item: r.title,
        title: r.title,
        description: r.blurb,
        blurb: r.blurb,
        icon: r.icon,
        cost: r.cost,
        stock: r.stock,
        type: r.type,
        active: true,
        createdAt: now,
      });
    }
    return { seeded: true, count: REWARD_CATALOG.length };
  },
});

/** The current user's redemptions (newest first), enriched with reward title. */
export const listRedemptions = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

    // V1 bound: newest 100 redemptions for this user.
    const redemptions = await ctx.db
      .query('redemptions')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .order('desc')
      .take(100);

    return await Promise.all(
      redemptions.map(async (red) => {
        const reward = await ctx.db.get(red.rewardId);
        const title = reward?.title ?? reward?.item ?? 'Reward';
        return {
          id: red._id,
          title,
          cost: red.cost,
          createdAt: red.createdAt,
        };
      }),
    );
  },
});

export const redeemReward = mutation({
  args: { rewardId: v.id('rewards') },
  handler: async (ctx, { rewardId }) => {
    const user = await getOrCreateUser(ctx);

    const reward = await ctx.db.get(rewardId);
    if (!reward) throw new Error('Reward not found');
    if (!reward.active) throw new Error('Reward not available');

    // Oversell guard.
    if (reward.stock <= 0) {
      throw new Error('Out of stock');
    }

    // Balance check (server-authoritative).
    const balance = await currentBalance(ctx, user._id);
    if (balance < reward.cost) {
      throw new Error('Insufficient points');
    }

    const now = Date.now();

    // 1) Decrement stock.
    await ctx.db.patch(rewardId, { stock: reward.stock - 1 });

    // 2) Redemption record.
    const redemptionId = await ctx.db.insert('redemptions', {
      userId: user._id,
      rewardId,
      cost: reward.cost,
      status: 'pending',
      createdAt: now,
    });

    // 3) Ledger spend entry (negative delta, running balance).
    const balanceAfter = balance - reward.cost;
    await ctx.db.insert('pointsLedger', {
      userId: user._id,
      delta: -reward.cost,
      type: 'spend',
      source: 'redemption',
      refId: redemptionId,
      balanceAfter,
      createdAt: now,
    });

    return {
      redemptionId,
      rewardId,
      cost: reward.cost,
      balanceAfter,
      stockRemaining: reward.stock - 1,
    };
  },
});
