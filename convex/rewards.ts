// Marketplace. `redeemReward` must be atomic and oversell-proof: balance check
// + stock decrement + redemption record + ledger spend entry all happen in one
// transactional mutation. Convex serializes the mutation over the reward/ledger
// docs it touches, so two concurrent redemptions of the last unit cannot both
// succeed — the second sees stock === 0 (after the first commits) and rejects.

import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { getOrCreateUser, currentBalance } from './lib/users';

/** Active reward catalog. */
export const listCatalog = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query('rewards')
      .withIndex('by_active', (q) => q.eq('active', true))
      .collect();
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
