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
  notifyTime: string; // HH:mm
  onboarded: boolean;
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
