// Shared domain types for Bounty (P1 uses these against a local mock store;
// P2 mirrors them in Convex). Keep field names stable — screens depend on them.

import type { Feather } from '@expo/vector-icons';

export type FeatherIcon = React.ComponentProps<typeof Feather>['name'];

export type Cadence = { kind: 'daily' } | { kind: 'weekly'; days: number[] }; // days: 0=Sun..6=Sat

export type HabitCategory = 'Health' | 'Movement' | 'Mind' | 'Growth' | 'Custom';

export type Habit = {
  id: string;
  name: string;
  icon: FeatherIcon;
  category: HabitCategory;
  cadence: Cadence;
  proofRequired: boolean;
  isCustom: boolean;
  pointValue: number;
};

export type HabitCompletion = {
  id: string;
  habitId: string;
  localDate: string; // YYYY-MM-DD
  proofId?: string;
  source: 'manual' | 'bereal';
  onTime: boolean;
  createdAt: number;
};

export type Proof = {
  id: string;
  habitId: string;
  completionId: string;
  photoUri: string;
  caption?: string;
  createdAt: number;
};

export type StreakState = {
  current: number;
  longest: number;
  lastCompletedDate: string | null; // YYYY-MM-DD
};

export type LedgerEntry = {
  id: string;
  delta: number;
  type: 'earn' | 'spend';
  source: string;
  refId?: string;
  balanceAfter: number;
  createdAt: number;
};

export type UserProfile = {
  name: string;
  avatarInitials: string;
  avatarColor: string;
  notifyTime: string; // HH:mm
  onboarded: boolean;
};

export type NotifPrefs = {
  dailyNudge: boolean;
  streakAtRisk: boolean;
  circleActivity: boolean;
  bereal: boolean;
};

export type Reward = {
  id: string;
  title: string;
  cost: number;
  type: 'brand' | 'cause';
  icon: FeatherIcon;
  stock: number;
  blurb?: string;
};

export type Redemption = {
  id: string;
  rewardId: string;
  title: string;
  cost: number;
  createdAt: number;
};

export type Badge = {
  id: string;
  name: string;
  icon: FeatherIcon;
  threshold: number;
  kind: 'streak' | 'count';
  blurb: string;
};

export type CircleVisibility = 'public' | 'private';

export type Circle = {
  id: string;
  name: string;
  visibility: CircleVisibility;
  inviteCode: string;
  createdBy: string;
};

export type CircleMember = {
  userId: string;
  name: string;
  avatarInitials: string;
  role: 'owner' | 'member';
  joinedAt: number;
};

export type CircleEventType = 'proof' | 'milestone' | 'joined' | 'cheer';

export type CircleEvent = {
  id: string;
  circleId: string;
  actorId: string;
  actorName: string;
  actorInitials: string;
  type: CircleEventType;
  habitName?: string;
  photoUri?: string;
  caption?: string;
  streak?: number;
  createdAt: number;
  cheers: number;
  cheeredByMe: boolean;
};

/** Returned by completeHabitToday — drives the award/first-win moment. */
export type AwardResult = {
  habitId: string;
  habitName: string;
  alreadyDone: boolean;
  basePoints: number;
  proofBonus: number;
  milestoneBonus: number;
  pointsEarned: number;
  newStreak: number;
  isMilestone: boolean;
  milestoneValue?: number;
};
