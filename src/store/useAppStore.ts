import { create } from 'zustand';

import { todayISO, todayWeekday, yesterdayISO } from '@/lib/date';
import { BADGE_CATALOG } from '@/data/badges';
import { DEMO_MEMBERS, buildDemoFeed } from '@/data/demoCircle';
import { REWARD_CATALOG } from '@/data/rewards';
import type {
  AwardResult,
  Badge,
  Circle,
  CircleEvent,
  CircleMember,
  Habit,
  HabitCompletion,
  LedgerEntry,
  NotifPrefs,
  Proof,
  Redemption,
  Reward,
  StreakState,
  UserProfile,
} from '@/lib/types';

// ─────────────────────────────────────────────────────────────────────────
// Bounty mock store (P1). In-memory, no persistence — starts unonboarded so
// the first-win journey runs on every launch. P2 swaps this for Convex.
//
// Screen contract (do not change these signatures without updating callers):
//   pickHabits(ids)          seed chosen library habits, then completeOnboarding()
//   habitsDueToday()         habits due today by cadence
//   isCompletedToday(id)     bool
//   completeHabitToday(id, { proofUri?, caption? }) => AwardResult
//        - idempotent per local day (alreadyDone:true if repeated)
//        - updates streak + points + ledger, sets `lastAward`
//   lastAward                read by the /award screen, then clearAward()
// ─────────────────────────────────────────────────────────────────────────

const PROOF_BONUS = 5;
const MILESTONES: Record<number, number> = { 7: 50, 30: 200, 100: 500 };
const USER_ID = 'me';
const genCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

let seq = 0;
const uid = (p: string) => `${p}-${Date.now()}-${seq++}`;

type CompleteOpts = { proofUri?: string; caption?: string };

type AppState = {
  user: UserProfile;
  habits: Habit[];
  completions: HabitCompletion[];
  proofs: Proof[];
  streaks: Record<string, StreakState>;
  ledger: LedgerEntry[];
  availablePoints: number;
  lifetimeEarned: number;
  lastAward: AwardResult | null;
  circles: Circle[];
  members: Record<string, CircleMember[]>;
  currentCircleId: string | null;
  feed: CircleEvent[];
  rewards: Reward[];
  redemptions: Redemption[];
  notifPrefs: NotifPrefs;

  setProfile: (p: { name: string; notifyTime?: string }) => void;
  pickHabits: (habitIds: string[]) => void;
  addCustomHabit: (h: Omit<Habit, 'id' | 'isCustom'>) => void;
  completeOnboarding: () => void;
  isCompletedToday: (habitId: string) => boolean;
  habitsDueToday: () => Habit[];
  completeHabitToday: (habitId: string, opts?: CompleteOpts) => AwardResult;
  clearAward: () => void;
  createCircle: (name: string, visibility: 'public' | 'private') => string;
  joinByCode: (code: string) => boolean;
  leaveCircle: () => void;
  cheer: (eventId: string) => void;
  redeemReward: (rewardId: string) => { ok: boolean; reason?: 'points' | 'stock' };
  earnedBadges: () => Badge[];
  setNotifPref: (key: keyof NotifPrefs, value: boolean) => void;
  setAvatarColor: (color: string) => void;
  reset: () => void;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'B';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const initialUser: UserProfile = {
  name: '',
  avatarInitials: 'B',
  avatarColor: '#8B5CF6',
  notifyTime: '20:00',
  onboarded: false,
};

const initialNotifPrefs: NotifPrefs = {
  dailyNudge: true,
  streakAtRisk: true,
  circleActivity: true,
  bereal: true,
};

export const useAppStore = create<AppState>()((set, get) => ({
  user: initialUser,
  habits: [],
  completions: [],
  proofs: [],
  streaks: {},
  ledger: [],
  availablePoints: 0,
  lifetimeEarned: 0,
  lastAward: null,
  circles: [],
  members: {},
  currentCircleId: null,
  feed: [],
  rewards: REWARD_CATALOG.map((r) => ({ ...r })),
  redemptions: [],
  notifPrefs: initialNotifPrefs,

  setProfile: ({ name, notifyTime }) =>
    set((s) => ({
      user: {
        ...s.user,
        name,
        avatarInitials: initials(name),
        notifyTime: notifyTime ?? s.user.notifyTime,
      },
    })),

  pickHabits: (habitIds) =>
    set((s) => {
      // Resolve from the library lazily to avoid a circular import.
      const { HABIT_LIBRARY } = require('@/data/habitLibrary') as typeof import('@/data/habitLibrary');
      const chosen = HABIT_LIBRARY.filter((h) => habitIds.includes(h.id));
      const existing = new Set(s.habits.map((h) => h.id));
      const added = chosen.filter((h) => !existing.has(h.id));
      const streaks = { ...s.streaks };
      for (const h of added) {
        if (!streaks[h.id]) streaks[h.id] = { current: 0, longest: 0, lastCompletedDate: null };
      }
      return { habits: [...s.habits, ...added], streaks };
    }),

  addCustomHabit: (h) =>
    set((s) => {
      const habit: Habit = { ...h, id: uid('habit'), isCustom: true };
      return {
        habits: [...s.habits, habit],
        streaks: { ...s.streaks, [habit.id]: { current: 0, longest: 0, lastCompletedDate: null } },
      };
    }),

  completeOnboarding: () => set((s) => ({ user: { ...s.user, onboarded: true } })),

  isCompletedToday: (habitId) => {
    const today = todayISO();
    return get().completions.some((c) => c.habitId === habitId && c.localDate === today);
  },

  habitsDueToday: () => {
    const wd = todayWeekday();
    return get().habits.filter((h) =>
      h.cadence.kind === 'daily' ? true : h.cadence.days.includes(wd),
    );
  },

  completeHabitToday: (habitId, opts = {}) => {
    const state = get();
    const habit = state.habits.find((h) => h.id === habitId);
    const today = todayISO();
    const prevStreak = state.streaks[habitId] ?? { current: 0, longest: 0, lastCompletedDate: null };

    if (!habit || state.isCompletedToday(habitId)) {
      const award: AwardResult = {
        habitId,
        habitName: habit?.name ?? '',
        alreadyDone: true,
        basePoints: 0,
        proofBonus: 0,
        milestoneBonus: 0,
        pointsEarned: 0,
        newStreak: prevStreak.current,
        isMilestone: false,
      };
      set({ lastAward: award });
      return award;
    }

    const newCurrent = prevStreak.lastCompletedDate === yesterdayISO() ? prevStreak.current + 1 : 1;
    const longest = Math.max(prevStreak.longest, newCurrent);

    const completionId = uid('comp');
    let proofId: string | undefined;
    const proofs = [...state.proofs];
    if (opts.proofUri) {
      proofId = uid('proof');
      proofs.push({
        id: proofId,
        habitId,
        completionId,
        photoUri: opts.proofUri,
        caption: opts.caption,
        createdAt: Date.now(),
      });
    }

    const completion: HabitCompletion = {
      id: completionId,
      habitId,
      localDate: today,
      proofId,
      source: 'manual',
      onTime: true,
      createdAt: Date.now(),
    };

    const basePoints = habit.pointValue;
    const proofBonus = opts.proofUri ? PROOF_BONUS : 0;
    const milestoneBonus = MILESTONES[newCurrent] ?? 0;
    const pointsEarned = basePoints + proofBonus + milestoneBonus;
    const balanceAfter = state.availablePoints + pointsEarned;

    const ledgerEntry: LedgerEntry = {
      id: uid('led'),
      delta: pointsEarned,
      type: 'earn',
      source: `complete:${habit.name}`,
      refId: completionId,
      balanceAfter,
      createdAt: Date.now(),
    };

    const award: AwardResult = {
      habitId,
      habitName: habit.name,
      alreadyDone: false,
      basePoints,
      proofBonus,
      milestoneBonus,
      pointsEarned,
      newStreak: newCurrent,
      isMilestone: milestoneBonus > 0,
      milestoneValue: milestoneBonus > 0 ? newCurrent : undefined,
    };

    set({
      completions: [...state.completions, completion],
      proofs,
      streaks: { ...state.streaks, [habitId]: { current: newCurrent, longest, lastCompletedDate: today } },
      ledger: [...state.ledger, ledgerEntry],
      availablePoints: balanceAfter,
      lifetimeEarned: state.lifetimeEarned + pointsEarned,
      lastAward: award,
    });

    const circleId = get().currentCircleId;
    if (circleId) {
      const me = get().user;
      const ev: CircleEvent = {
        id: uid('ev'),
        circleId,
        actorId: USER_ID,
        actorName: me.name || 'You',
        actorInitials: me.avatarInitials || 'B',
        type: award.isMilestone ? 'milestone' : 'proof',
        habitName: habit.name,
        photoUri: opts.proofUri,
        caption: opts.caption,
        streak: newCurrent,
        createdAt: Date.now(),
        cheers: 0,
        cheeredByMe: false,
      };
      set((st) => ({ feed: [ev, ...st.feed] }));
    }

    return award;
  },

  clearAward: () => set({ lastAward: null }),

  createCircle: (name, visibility) => {
    const code = genCode();
    const cid = uid('circle');
    const me = get().user;
    const owner: CircleMember = {
      userId: USER_ID,
      name: me.name || 'You',
      avatarInitials: me.avatarInitials || 'B',
      role: 'owner',
      joinedAt: Date.now(),
    };
    set({
      circles: [{ id: cid, name: name || 'My Circle', visibility, inviteCode: code, createdBy: USER_ID }],
      members: { [cid]: [owner] },
      currentCircleId: cid,
      feed: [],
    });
    return code;
  },

  joinByCode: (code) => {
    const cid = uid('circle');
    const me = get().user;
    const meMember: CircleMember = {
      userId: USER_ID,
      name: me.name || 'You',
      avatarInitials: me.avatarInitials || 'B',
      role: 'member',
      joinedAt: Date.now(),
    };
    set({
      circles: [
        { id: cid, name: "Theo's Circle", visibility: 'private', inviteCode: code.toUpperCase(), createdBy: 'demo-theo' },
      ],
      members: { [cid]: [...DEMO_MEMBERS, meMember] },
      currentCircleId: cid,
      feed: buildDemoFeed(cid),
    });
    return true;
  },

  leaveCircle: () => set({ circles: [], members: {}, currentCircleId: null, feed: [] }),

  redeemReward: (rewardId) => {
    const s = get();
    const reward = s.rewards.find((r) => r.id === rewardId);
    if (!reward || reward.stock <= 0) return { ok: false, reason: 'stock' };
    if (s.availablePoints < reward.cost) return { ok: false, reason: 'points' };
    const balanceAfter = s.availablePoints - reward.cost;
    const redemptionId = uid('redeem');
    set({
      availablePoints: balanceAfter,
      rewards: s.rewards.map((r) => (r.id === rewardId ? { ...r, stock: r.stock - 1 } : r)),
      redemptions: [
        { id: redemptionId, rewardId, title: reward.title, cost: reward.cost, createdAt: Date.now() },
        ...s.redemptions,
      ],
      ledger: [
        ...s.ledger,
        { id: uid('led'), delta: -reward.cost, type: 'spend', source: `redeem:${reward.title}`, refId: redemptionId, balanceAfter, createdAt: Date.now() },
      ],
    });
    return { ok: true };
  },

  earnedBadges: () => {
    const s = get();
    const longest = Math.max(0, ...Object.values(s.streaks).map((st) => st.longest));
    const total = s.completions.length;
    return BADGE_CATALOG.filter((b) =>
      b.kind === 'streak' ? longest >= b.threshold : total >= b.threshold,
    );
  },

  setNotifPref: (key, value) => set((s) => ({ notifPrefs: { ...s.notifPrefs, [key]: value } })),

  setAvatarColor: (color) => set((s) => ({ user: { ...s.user, avatarColor: color } })),

  cheer: (eventId) =>
    set((st) => ({
      feed: st.feed.map((e) =>
        e.id === eventId
          ? { ...e, cheeredByMe: !e.cheeredByMe, cheers: e.cheers + (e.cheeredByMe ? -1 : 1) }
          : e,
      ),
    })),

  reset: () =>
    set({
      user: initialUser,
      habits: [],
      completions: [],
      proofs: [],
      streaks: {},
      ledger: [],
      availablePoints: 0,
      lifetimeEarned: 0,
      lastAward: null,
      circles: [],
      members: {},
      currentCircleId: null,
      feed: [],
      rewards: REWARD_CATALOG.map((r) => ({ ...r })),
      redemptions: [],
      notifPrefs: initialNotifPrefs,
    }),
}));
