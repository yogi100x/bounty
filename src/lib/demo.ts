// TEMPORARY presentation mode for screenshots / demos.
// Enabled only when EXPO_PUBLIC_PRESENTATION=1 (set in .env.local, gitignored).
// When on, the data hooks (src/data/core.ts, src/data/social.ts) return this
// canned data and the auth gate is bypassed, so every screen renders populated
// without sign-in or a backend round-trip. Safe to delete when no longer needed.

import type { AwardResult } from '@/lib/types';

export const PRESENTATION = process.env.EXPO_PUBLIC_PRESENTATION === '1';

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Last `n` days, with a couple skipped so the activity grid looks real. */
function recentDates(n: number): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    if (i === 2 || i === 8) continue; // a couple of missed days
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    out.push(iso(d));
  }
  return out;
}

const H = (over: Record<string, unknown>) => ({
  ownerId: 'demo-user',
  category: 'Mind',
  cadence: { kind: 'daily' },
  isCustom: false,
  source: 'library',
  archived: false,
  pointValue: 10,
  createdAt: 0,
  _creationTime: 0,
  ...over,
});

export const DEMO_SNAPSHOT = {
  profile: { name: 'Yogi', avatarColor: '#8B5CF6', onboarded: true },
  points: 340,
  lifetimeEarned: 690,
  habits: [
    H({ _id: 'h1', name: 'Work out', icon: 'activity', category: 'Movement', proofRequired: true, pointValue: 20, current: 6, longest: 14, doneToday: false }),
    H({ _id: 'h2', name: 'Read', icon: 'book-open', proofRequired: false, current: 12, longest: 12, doneToday: true }),
    H({ _id: 'h3', name: 'Meditate', icon: 'feather', proofRequired: false, current: 3, longest: 8, doneToday: false }),
    H({ _id: 'h4', name: 'Drink water', icon: 'droplet', category: 'Health', proofRequired: false, current: 6, longest: 9, doneToday: false }),
  ],
  dueHabitIds: ['h1', 'h2', 'h3', 'h4'],
  totalCompletions: 48,
  bestCurrentStreak: 12,
  longestStreak: 14,
  recentCompletionDates: recentDates(13),
};

export const DEMO_LEDGER = [
  { id: 'l1', delta: 60, type: 'earn', source: 'completion+proof', balanceAfter: 340, createdAt: Date.now() - 3_600_000 },
  { id: 'l2', delta: -150, type: 'spend', source: 'redemption', balanceAfter: 280, createdAt: Date.now() - 86_400_000 },
  { id: 'l3', delta: 10, type: 'earn', source: 'completion', balanceAfter: 430, createdAt: Date.now() - 90_000_000 },
  { id: 'l4', delta: 50, type: 'earn', source: 'completion', balanceAfter: 420, createdAt: Date.now() - 180_000_000 },
];

export const DEMO_CIRCLE = {
  circle: { _id: 'c1', name: "Yogi's Circle", visibility: 'private', inviteCode: 'BNTY42', memberCount: 3 },
  members: [
    { userId: 'demo-user', name: 'Yogi', initials: 'YO', role: 'owner', isMe: true },
    { userId: 'm1', name: 'Maya', initials: 'MA', role: 'member', isMe: false },
    { userId: 'm2', name: 'Theo', initials: 'TH', role: 'member', isMe: false },
  ],
  feed: [
    { id: 'e1', type: 'proof', actorId: 'm1', actorName: 'Maya', actorInitials: 'MA', habitName: 'Work out', caption: 'Morning run done.', streak: 12, photoUrl: null, createdAt: Date.now() - 3_600_000, cheers: 2, cheeredByMe: false },
    { id: 'e2', type: 'milestone', actorId: 'm2', actorName: 'Theo', actorInitials: 'TH', habitName: 'Read', streak: 7, photoUrl: null, createdAt: Date.now() - 10_800_000, cheers: 4, cheeredByMe: true },
    { id: 'e3', type: 'proof', actorId: 'demo-user', actorName: 'Yogi', actorInitials: 'YO', habitName: 'Read', caption: 'Ten pages in.', streak: 12, photoUrl: null, createdAt: Date.now() - 20_000_000, cheers: 1, cheeredByMe: false },
    { id: 'e4', type: 'joined', actorId: 'm2', actorName: 'Theo', actorInitials: 'TH', photoUrl: null, createdAt: Date.now() - 200_000_000, cheers: 0, cheeredByMe: false },
  ],
};

export const DEMO_REWARDS = [
  { _id: 'r1', title: 'Plant a tree', cost: 150, type: 'cause', icon: 'feather', blurb: 'We donate to reforestation in your name.', stock: 999 },
  { _id: 'r2', title: 'Donate a meal', cost: 200, type: 'cause', icon: 'heart', blurb: 'Fund a meal for someone in need.', stock: 999 },
  { _id: 'r3', title: 'Clean water day', cost: 350, type: 'cause', icon: 'droplet', blurb: 'A day of clean water for a family.', stock: 999 },
  { _id: 'r4', title: '$5 coffee card', cost: 500, type: 'brand', icon: 'coffee', blurb: 'Treat yourself — you earned it.', stock: 25 },
  { _id: 'r5', title: 'eBook of choice', cost: 1200, type: 'brand', icon: 'book-open', blurb: 'Pick any title up to $15.', stock: 15 },
  { _id: 'r6', title: '1 month music', cost: 1500, type: 'brand', icon: 'headphones', blurb: 'A month of streaming, on us.', stock: 10 },
];

export const DEMO_REDEMPTIONS = [
  { id: 'rd1', title: 'Plant a tree', cost: 150, createdAt: Date.now() - 86_400_000 },
  { id: 'rd2', title: 'Donate a meal', cost: 200, createdAt: Date.now() - 600_000_000 },
];

export const DEMO_AWARD: AwardResult = {
  habitId: 'h2',
  habitName: 'Read',
  alreadyDone: false,
  basePoints: 10,
  proofBonus: 0,
  milestoneBonus: 50,
  pointsEarned: 60,
  newStreak: 7,
  isMilestone: true,
  milestoneValue: 7,
};
