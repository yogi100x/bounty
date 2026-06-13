// Client data layer for Circles + Rewards (P2b) over Convex.

import { useMutation, useQuery } from 'convex/react';

import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

/** Active circle + members + enriched feed, or null. `undefined` while loading. */
export function useCircle() {
  return useQuery(api.circles.current, {});
}
export type Circle = NonNullable<ReturnType<typeof useCircle>>;
export type FeedEvent = Circle['feed'][number];
export type Member = Circle['members'][number];

export function useRewards() {
  return useQuery(api.rewards.listCatalog, {});
}
export type Reward = NonNullable<ReturnType<typeof useRewards>>[number];

export function useRedemptions() {
  return useQuery(api.rewards.listRedemptions, {});
}

export function useCircleActions() {
  const createM = useMutation(api.circles.create);
  const joinM = useMutation(api.circles.joinByCode);
  const leaveM = useMutation(api.circles.leave);
  const cheerM = useMutation(api.circles.cheer);
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
  return {
    /** Throws on insufficient points / out of stock (server-authoritative). */
    redeem: (rewardId: Id<'rewards'>) => redeemM({ rewardId }),
  };
}
