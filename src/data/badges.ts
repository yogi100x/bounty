import type { Badge } from '@/lib/types';

// Earned badges are DERIVED (see useAppStore.earnedBadges): streak badges off
// the best longest streak, count badges off total completions.
export const BADGE_CATALOG: Badge[] = [
  { id: 'bd-first', name: 'First proof', icon: 'check-circle', threshold: 1, kind: 'count', blurb: 'You showed up once. It begins.' },
  { id: 'bd-week', name: '7-day streak', icon: 'award', threshold: 7, kind: 'streak', blurb: 'A full week. Momentum.' },
  { id: 'bd-ten', name: '10 proofs', icon: 'target', threshold: 10, kind: 'count', blurb: 'Ten times witnessed.' },
  { id: 'bd-month', name: '30-day streak', icon: 'star', threshold: 30, kind: 'streak', blurb: 'A month. This is who you are now.' },
  { id: 'bd-fifty', name: '50 proofs', icon: 'trending-up', threshold: 50, kind: 'count', blurb: 'Fifty. Unmistakable.' },
  { id: 'bd-hundred', name: '100-day streak', icon: 'zap', threshold: 100, kind: 'streak', blurb: 'A hundred days. Legendary.' },
];
