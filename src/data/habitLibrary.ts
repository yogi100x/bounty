import type { Habit } from '@/lib/types';

// Curated starter library. proofRequired habits route through the capture
// screen on completion; others complete inline. pointValue feeds the award.
export const HABIT_LIBRARY: Habit[] = [
  { id: 'lib-water', name: 'Drink water', icon: 'droplet', category: 'Health', cadence: { kind: 'daily' }, proofRequired: false, isCustom: false, pointValue: 10 },
  { id: 'lib-walk', name: 'Take a walk', icon: 'sun', category: 'Movement', cadence: { kind: 'daily' }, proofRequired: true, isCustom: false, pointValue: 15 },
  { id: 'lib-workout', name: 'Work out', icon: 'activity', category: 'Movement', cadence: { kind: 'daily' }, proofRequired: true, isCustom: false, pointValue: 20 },
  { id: 'lib-read', name: 'Read', icon: 'book-open', category: 'Mind', cadence: { kind: 'daily' }, proofRequired: false, isCustom: false, pointValue: 10 },
  { id: 'lib-meditate', name: 'Meditate', icon: 'feather', category: 'Mind', cadence: { kind: 'daily' }, proofRequired: false, isCustom: false, pointValue: 10 },
  { id: 'lib-sleep', name: 'Sleep by 11', icon: 'moon', category: 'Health', cadence: { kind: 'daily' }, proofRequired: false, isCustom: false, pointValue: 10 },
  { id: 'lib-journal', name: 'Journal', icon: 'edit-3', category: 'Growth', cadence: { kind: 'daily' }, proofRequired: false, isCustom: false, pointValue: 10 },
  { id: 'lib-stretch', name: 'Stretch', icon: 'zap', category: 'Movement', cadence: { kind: 'daily' }, proofRequired: false, isCustom: false, pointValue: 10 },
  { id: 'lib-gratitude', name: 'Gratitude', icon: 'heart', category: 'Growth', cadence: { kind: 'daily' }, proofRequired: false, isCustom: false, pointValue: 10 },
  { id: 'lib-nocaffeine', name: 'No caffeine after 2', icon: 'coffee', category: 'Health', cadence: { kind: 'daily' }, proofRequired: false, isCustom: false, pointValue: 10 },
  { id: 'lib-learn', name: 'Learn something', icon: 'headphones', category: 'Growth', cadence: { kind: 'daily' }, proofRequired: false, isCustom: false, pointValue: 10 },
  { id: 'lib-smile', name: 'Reach out to a friend', icon: 'smile', category: 'Growth', cadence: { kind: 'daily' }, proofRequired: false, isCustom: false, pointValue: 10 },
];
