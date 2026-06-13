import type { Reward } from '@/lib/types';

// V1 catalog. `cause` (donation) rewards seed the marketplace so redemption
// works at launch without brand deals (IMPLEMENTATION-PLAN). Fulfillment is
// manual ops in V1 — redemption is recorded in-app.
export const REWARD_CATALOG: Reward[] = [
  { id: 'rw-tree', title: 'Plant a tree', cost: 150, type: 'cause', icon: 'feather', stock: 999, blurb: 'We donate to reforestation in your name.' },
  { id: 'rw-meal', title: 'Donate a meal', cost: 200, type: 'cause', icon: 'heart', stock: 999, blurb: 'Fund a meal for someone in need.' },
  { id: 'rw-coffee', title: '$5 coffee card', cost: 500, type: 'brand', icon: 'coffee', stock: 25, blurb: 'Treat yourself — you earned it.' },
  { id: 'rw-clean-water', title: 'Clean water day', cost: 350, type: 'cause', icon: 'droplet', stock: 999, blurb: 'A day of clean water for a family.' },
  { id: 'rw-music', title: '1 month music', cost: 1500, type: 'brand', icon: 'headphones', stock: 10, blurb: 'A month of streaming, on us.' },
  { id: 'rw-book', title: 'eBook of choice', cost: 1200, type: 'brand', icon: 'book-open', stock: 15, blurb: 'Pick any title up to $15.' },
];
