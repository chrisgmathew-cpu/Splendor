import { Card, GemColor, GemCounts, Noble } from './types';

/**
 * The authentic base-game deck: 90 development cards (40/30/20 per tier)
 * and 10 nobles. Verified against two independent open-source datasets.
 * Compact keys: w=white u=blue g=green r=red k=black.
 */

type Key = 'w' | 'u' | 'g' | 'r' | 'k';
const COLOR: Record<Key, GemColor> = {
  w: 'white',
  u: 'blue',
  g: 'green',
  r: 'red',
  k: 'black',
};

type RawCard = [tier: 1 | 2 | 3, bonus: Key, pts: number, cost: Partial<Record<Key, number>>];

const RAW_CARDS: RawCard[] = [
  // ---- Tier 1 (40) ----
  [1, 'w', 0, { u: 1, g: 1, r: 1, k: 1 }],
  [1, 'w', 0, { u: 1, g: 2, r: 1, k: 1 }],
  [1, 'w', 0, { u: 2, g: 2, k: 1 }],
  [1, 'w', 0, { w: 3, u: 1, k: 1 }],
  [1, 'w', 0, { r: 2, k: 1 }],
  [1, 'w', 0, { u: 2, k: 2 }],
  [1, 'w', 0, { u: 3 }],
  [1, 'w', 1, { g: 4 }],
  [1, 'u', 0, { w: 1, g: 1, r: 1, k: 1 }],
  [1, 'u', 0, { w: 1, g: 1, r: 2, k: 1 }],
  [1, 'u', 0, { w: 1, g: 2, r: 2 }],
  [1, 'u', 0, { u: 1, g: 3, r: 1 }],
  [1, 'u', 0, { w: 1, k: 2 }],
  [1, 'u', 0, { g: 2, k: 2 }],
  [1, 'u', 0, { k: 3 }],
  [1, 'u', 1, { r: 4 }],
  [1, 'g', 0, { w: 1, u: 1, r: 1, k: 1 }],
  [1, 'g', 0, { w: 1, u: 1, r: 1, k: 2 }],
  [1, 'g', 0, { u: 1, r: 2, k: 2 }],
  [1, 'g', 0, { w: 1, u: 3, g: 1 }],
  [1, 'g', 0, { w: 2, u: 1 }],
  [1, 'g', 0, { u: 2, r: 2 }],
  [1, 'g', 0, { r: 3 }],
  [1, 'g', 1, { k: 4 }],
  [1, 'r', 0, { w: 1, u: 1, g: 1, k: 1 }],
  [1, 'r', 0, { w: 2, u: 1, g: 1, k: 1 }],
  [1, 'r', 0, { w: 2, g: 1, k: 2 }],
  [1, 'r', 0, { w: 1, r: 1, k: 3 }],
  [1, 'r', 0, { u: 2, g: 1 }],
  [1, 'r', 0, { w: 2, r: 2 }],
  [1, 'r', 0, { w: 3 }],
  [1, 'r', 1, { w: 4 }],
  [1, 'k', 0, { w: 1, u: 1, g: 1, r: 1 }],
  [1, 'k', 0, { w: 1, u: 2, g: 1, r: 1 }],
  [1, 'k', 0, { w: 2, u: 2, r: 1 }],
  [1, 'k', 0, { g: 1, r: 3, k: 1 }],
  [1, 'k', 0, { g: 2, r: 1 }],
  [1, 'k', 0, { w: 2, g: 2 }],
  [1, 'k', 0, { g: 3 }],
  [1, 'k', 1, { u: 4 }],
  // ---- Tier 2 (30) ----
  [2, 'w', 1, { g: 3, r: 2, k: 2 }],
  [2, 'w', 1, { w: 2, u: 3, r: 3 }],
  [2, 'w', 2, { g: 1, r: 4, k: 2 }],
  [2, 'w', 2, { r: 5, k: 3 }],
  [2, 'w', 2, { r: 5 }],
  [2, 'w', 3, { w: 6 }],
  [2, 'u', 1, { u: 2, g: 2, r: 3 }],
  [2, 'u', 1, { u: 2, g: 3, k: 3 }],
  [2, 'u', 2, { w: 2, r: 1, k: 4 }],
  [2, 'u', 2, { w: 5, u: 3 }],
  [2, 'u', 2, { u: 5 }],
  [2, 'u', 3, { u: 6 }],
  [2, 'g', 1, { w: 3, g: 2, r: 3 }],
  [2, 'g', 1, { w: 2, u: 3, k: 2 }],
  [2, 'g', 2, { w: 4, u: 2, k: 1 }],
  [2, 'g', 2, { u: 5, g: 3 }],
  [2, 'g', 2, { g: 5 }],
  [2, 'g', 3, { g: 6 }],
  [2, 'r', 1, { w: 2, r: 2, k: 3 }],
  [2, 'r', 1, { u: 3, r: 2, k: 3 }],
  [2, 'r', 2, { w: 1, u: 4, g: 2 }],
  [2, 'r', 2, { w: 3, k: 5 }],
  [2, 'r', 2, { k: 5 }],
  [2, 'r', 3, { r: 6 }],
  [2, 'k', 1, { w: 3, u: 2, g: 2 }],
  [2, 'k', 1, { w: 3, g: 3, k: 2 }],
  [2, 'k', 2, { u: 1, g: 4, r: 2 }],
  [2, 'k', 2, { g: 5, r: 3 }],
  [2, 'k', 2, { w: 5 }],
  [2, 'k', 3, { k: 6 }],
  // ---- Tier 3 (20) ----
  [3, 'w', 3, { u: 3, g: 3, r: 5, k: 3 }],
  [3, 'w', 4, { k: 7 }],
  [3, 'w', 4, { w: 3, r: 3, k: 6 }],
  [3, 'w', 5, { w: 3, k: 7 }],
  [3, 'u', 3, { w: 3, g: 3, r: 3, k: 5 }],
  [3, 'u', 4, { w: 7 }],
  [3, 'u', 4, { w: 6, u: 3, k: 3 }],
  [3, 'u', 5, { w: 7, u: 3 }],
  [3, 'g', 3, { w: 5, u: 3, r: 3, k: 3 }],
  [3, 'g', 4, { u: 7 }],
  [3, 'g', 4, { w: 3, u: 6, g: 3 }],
  [3, 'g', 5, { u: 7, g: 3 }],
  [3, 'r', 3, { w: 3, u: 5, g: 3, k: 3 }],
  [3, 'r', 4, { g: 7 }],
  [3, 'r', 4, { u: 3, g: 6, r: 3 }],
  [3, 'r', 5, { g: 7, r: 3 }],
  [3, 'k', 3, { w: 3, u: 3, g: 5, r: 3 }],
  [3, 'k', 4, { r: 7 }],
  [3, 'k', 4, { g: 3, r: 6, k: 3 }],
  [3, 'k', 5, { r: 7, k: 3 }],
];

type RawNoble = Partial<Record<Key, number>>;

const RAW_NOBLES: RawNoble[] = [
  { w: 4, u: 4 },
  { u: 4, g: 4 },
  { g: 4, r: 4 },
  { r: 4, k: 4 },
  { w: 4, k: 4 },
  { w: 3, u: 3, g: 3 },
  { u: 3, g: 3, r: 3 },
  { g: 3, r: 3, k: 3 },
  { w: 3, r: 3, k: 3 },
  { w: 3, u: 3, k: 3 },
];

function expandCost(raw: Partial<Record<Key, number>>): GemCounts {
  const out: GemCounts = {};
  for (const [k, v] of Object.entries(raw)) out[COLOR[k as Key]] = v;
  return out;
}

export const ALL_CARDS: Card[] = RAW_CARDS.map(([tier, bonus, points, cost], i) => ({
  id: i + 1,
  tier,
  bonus: COLOR[bonus],
  points,
  cost: expandCost(cost),
}));

export const ALL_NOBLES: Noble[] = RAW_NOBLES.map((req, i) => ({
  id: 100 + i,
  points: 3,
  requirement: expandCost(req),
}));
