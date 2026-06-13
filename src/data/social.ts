// Client data layer for Circles + Rewards (P2b) over Convex.

import { useMutation, useQuery } from 'convex/react';

import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { DEMO_CIRCLE, DEMO_REDEMPTIONS, DEMO_REWARDS, PRESENTATION } from '@/lib/demo';

/** Active circle + members + enriched feed, or null. `undefined` while loading. */
export function useCircle() {
  const live = useQuery(api.circles.current, PRESENTATION ? 'skip' : {});
  return PRESENTATION ? (DEMO_CIRCLE as unknown as typeof live) : live;
}
export type Circle = NonNullable<ReturnType<typeof useCircle>>;
export type FeedEvent = Circle['feed'][number];
export type Member = Circle['members'][number];

export function useRewards() {
  const live = useQuery(api.rewards.listCatalog, PRESENTATION ? 'skip' : {});
  return PRESENTATION ? (DEMO_REWARDS as unknown as typeof live) : live;
}
export type Reward = NonNullable<ReturnType<typeof useRewards>>[number];

export function useRedemptions() {
  const live = useQuery(api.rewards.listRedemptions, PRESENTATION ? 'skip' : {});
  return PRESENTATION ? (DEMO_REDEMPTIONS as unknown as typeof live) : live;
}

export function useCircleActions() {
  const createM = useMutation(api.circles.create);
  const joinM = useMutation(api.circles.joinByCode);
  const leaveM = useMutation(api.circles.leave);
  const cheerM = useMutation(api.circles.cheer);
  if (PRESENTATION) {
    return {
      createCircle: async (_n: string, _v: 'public' | 'private') => ({ inviteCode: 'BNTY42' } as any),
      joinByCode: async (_c: string) => ({ joined: true, alreadyMember: false } as any),
      leave: async (_id: Id<'circles'>) => ({} as any),
      cheer: async (_id: Id<'circleEvents'>) => ({} as any),
    };
  }
  return {
    /** Returns the created circle doc (incl. inviteCode). */
    createCircle: (name: string, visibility: 'public' | 'private') =>
      createM({ name, visibility }),
    /** Returns { joined, alreadyMember, circleId }. */
    joinByCode: (inviteCode: string) => joinM({ inviteCode }),
    leave: (circleId: Id<'circles'>) => leaveM({ circleId }),
    cheer: (circleEventId: Id<'circleEvents'>) => cheerM({ circleEventId }),
  };
}

export function useRewardActions() {
  const redeemM = useMutation(api.rewards.redeemReward);
  if (PRESENTATION) {
    return { redeem: async (_id: Id<'rewards'>) => ({ balanceAfter: 190, stockRemaining: 24 } as any) };
  }
  return {
    /** Throws on insufficient points / out of stock (server-authoritative). */
    redeem: (rewardId: Id<'rewards'>) => redeemM({ rewardId }),
  };
}
