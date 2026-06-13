import type { CircleEvent, CircleMember } from '@/lib/types';

// Mock peers + a lively feed so the Circle experience is demoable in P1/P3
// without a backend. Joining by code drops you into this active circle;
// creating a circle starts empty (the warmth/empty state).
export const DEMO_MEMBERS: CircleMember[] = [
  { userId: 'demo-theo', name: 'Theo', avatarInitials: 'TH', role: 'owner', joinedAt: Date.now() },
  { userId: 'demo-maya', name: 'Maya', avatarInitials: 'MA', role: 'member', joinedAt: Date.now() },
];

let s = 0;
const evId = () => `ev-seed-${s++}`;
const hrsAgo = (h: number) => Date.now() - h * 3_600_000;

export function buildDemoFeed(circleId: string): CircleEvent[] {
  return [
    { id: evId(), circleId, actorId: 'demo-maya', actorName: 'Maya', actorInitials: 'MA', type: 'proof', habitName: 'Work out', caption: 'Morning run done.', streak: 12, createdAt: hrsAgo(1), cheers: 2, cheeredByMe: false },
    { id: evId(), circleId, actorId: 'demo-theo', actorName: 'Theo', actorInitials: 'TH', type: 'milestone', habitName: 'Read', streak: 7, createdAt: hrsAgo(3), cheers: 4, cheeredByMe: true },
    { id: evId(), circleId, actorId: 'demo-maya', actorName: 'Maya', actorInitials: 'MA', type: 'proof', habitName: 'Meditate', caption: 'Ten quiet minutes.', streak: 11, createdAt: hrsAgo(20), cheers: 1, cheeredByMe: false },
    { id: evId(), circleId, actorId: 'demo-theo', actorName: 'Theo', actorInitials: 'TH', type: 'joined', createdAt: hrsAgo(48), cheers: 0, cheeredByMe: false },
  ];
}
