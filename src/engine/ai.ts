import {
  Action,
  AiDifficulty,
  Card,
  GameState,
  GemColor,
  GEM_COLORS,
  MAX_TOKENS,
  PlayerState,
  TokenCounts,
  TOKEN_COLORS,
} from './types';
import {
  bonuses,
  canAfford,
  count,
  legalActions,
  qualifyingNobles,
  score,
  totalTokens,
} from './game';

/**
 * Heuristic AI.
 *
 * The core idea: identify "target" cards (best value-per-effort face-up or
 * reserved cards), then score every legal action by how much it advances us
 * toward targets, nobles and outright points. Difficulty tunes noise,
 * blocking awareness and target depth.
 */

interface ScoredAction {
  action: Action;
  value: number;
}

/** Turns a color deficit map into a scalar "distance" (gold counts as any). */
function deficitFor(player: PlayerState, card: Card): { total: number; byColor: TokenCounts } {
  const bonus = bonuses(player);
  const byColor: TokenCounts = {};
  let total = 0;
  let goldLeft = count(player.tokens, 'gold');
  for (const c of GEM_COLORS) {
    let need = Math.max(0, (card.cost[c] ?? 0) - (bonus[c] ?? 0) - count(player.tokens, c));
    const useGold = Math.min(goldLeft, need);
    goldLeft -= useGold;
    need -= useGold;
    if (need > 0) byColor[c] = need;
    total += need;
  }
  return { total, byColor };
}

/** How useful a card's bonus color is for future purchases and nobles. */
function bonusUtility(state: GameState, player: PlayerState, color: GemColor): number {
  let util = 0;
  const bonus = bonuses(player);
  // Bonus reduces cost of visible cards that still need this color.
  for (const row of state.market) {
    for (const card of row) {
      if (card && (card.cost[color] ?? 0) > (bonus[color] ?? 0)) util += 0.15;
    }
  }
  // Bonus advances noble requirements.
  for (const noble of state.nobles) {
    const req = noble.requirement[color] ?? 0;
    if (req > (bonus[color] ?? 0)) util += 0.55;
  }
  return util;
}

/** Cards worth chasing, best first. */
function targetCards(state: GameState, player: PlayerState, depth: number): Card[] {
  const candidates: Card[] = [];
  for (const row of state.market) for (const card of row) if (card) candidates.push(card);
  candidates.push(...player.reserved);

  const scored = candidates
    .map((card) => {
      const { total } = deficitFor(player, card);
      if (total > 7) return null; // out of realistic reach
      const value =
        card.points * 2.2 +
        bonusUtility(state, player, card.bonus) +
        (card.points === 0 ? 0.4 : 0); // cheap engine cards still matter early
      return { card, score: value / (total + 1) };
    })
    .filter((x): x is { card: Card; score: number } => x !== null)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, depth).map((s) => s.card);
}

function scoreBuy(state: GameState, player: PlayerState, card: Card, hard: boolean): number {
  let v = 10 + card.points * 6 + bonusUtility(state, player, card.bonus) * 2;

  // Noble progress: does this bonus move us toward a noble?
  const bonus = bonuses(player);
  for (const noble of state.nobles) {
    const req = noble.requirement[card.bonus] ?? 0;
    if (req > (bonus[card.bonus] ?? 0)) {
      const remaining = GEM_COLORS.reduce(
        (s, c) => s + Math.max(0, (noble.requirement[c] ?? 0) - (bonus[c] ?? 0)),
        0,
      );
      v += remaining <= 2 ? 5 : 2;
    }
  }

  // Winning move? Overwhelming priority.
  const myScore = score(player);
  if (myScore + card.points >= 15) v += 1000;
  // Also count an immediately-qualifying noble as winning points.
  if (hard) {
    const withCard: PlayerState = { ...player, cards: [...player.cards, card] };
    const qualifies = state.nobles.some((n) =>
      GEM_COLORS.every((c) => {
        const b = (bonuses(withCard)[c] ?? 0);
        return b >= (n.requirement[c] ?? 0);
      }),
    );
    if (qualifies && myScore + card.points + 3 >= 15) v += 1000;
    else if (qualifies) v += 6;
  }
  return v;
}

function scoreTake(
  player: PlayerState,
  colors: GemColor[],
  targets: Card[],
): number {
  let v = 1 + colors.length * 0.4;
  // Progress toward targets, weighted by target priority.
  targets.forEach((card, idx) => {
    const { total, byColor } = deficitFor(player, card);
    if (total === 0) return;
    const weight = (targets.length - idx) / targets.length;
    let helped = 0;
    for (const c of colors) helped += Math.min(1, count(byColor, c));
    v += helped * 2.2 * weight;
    if (helped >= total) v += 1.5 * weight; // completes a target
  });
  // Penalty for busting the 10-token limit.
  const after = totalTokens(player.tokens) + colors.length;
  if (after > MAX_TOKENS) v -= (after - MAX_TOKENS) * 2.5;
  return v;
}

function scoreReserve(
  state: GameState,
  player: PlayerState,
  card: Card,
  targets: Card[],
  hard: boolean,
): number {
  let v = 0.5;
  if (count(state.bank, 'gold') > 0) v += 1.2; // gold is a wildcard
  if (targets[0]?.id === card.id) v += 1.5; // protect our top target
  if (player.reserved.length >= 2) v -= 2; // don't clog reserve slots

  if (hard) {
    // Block: would an opponent buy this high-value card right now?
    for (let i = 0; i < state.players.length; i++) {
      if (i === state.players.indexOf(player)) continue;
      const opp = state.players[i];
      if (card.points >= 3 && canAfford(opp, card)) {
        if (score(opp) + card.points >= 13) v += 8; // deny near-win
        else v += 2.5;
      }
    }
  }
  return v;
}

export function chooseAction(state: GameState, rng: () => number): Action {
  const player = state.players[state.current];
  const difficulty: AiDifficulty = player.difficulty ?? 'medium';
  const hard = difficulty === 'hard';
  const actions = legalActions(state);
  if (actions.length === 0) return { type: 'pass' };

  const targets = targetCards(state, player, hard ? 4 : 2);

  const scored: ScoredAction[] = actions.map((action) => {
    let value = 0;
    switch (action.type) {
      case 'buy': {
        const card =
          action.from === 'reserved'
            ? player.reserved.find((c) => c.id === action.cardId)!
            : findCard(state, action.cardId)!;
        value = scoreBuy(state, player, card, hard);
        break;
      }
      case 'take3':
        value = scoreTake(player, action.colors, targets);
        break;
      case 'take2':
        value = scoreTake(player, [action.color, action.color] as GemColor[], targets) + 0.3;
        break;
      case 'reserve': {
        const card = findCard(state, action.cardId!)!;
        value = scoreReserve(state, player, card, targets, hard);
        break;
      }
      case 'pass':
        value = -100;
        break;
    }
    return { action, value };
  });

  scored.sort((a, b) => b.value - a.value);

  if (difficulty === 'easy') {
    // Pick randomly among the top half, with noise — plays "plausibly badly".
    const pool = scored.slice(0, Math.max(3, Math.ceil(scored.length / 2)));
    return pool[Math.floor(rng() * pool.length)].action;
  }
  if (difficulty === 'medium') {
    // Small noise among near-best options.
    const best = scored[0].value;
    const pool = scored.filter((s) => s.value >= best - 1.0);
    return pool[Math.floor(rng() * pool.length)].action;
  }
  return scored[0].action;
}

/** Choose tokens to discard down to the limit: keep what targets need. */
export function chooseDiscards(state: GameState): TokenCounts {
  const player = state.players[state.current];
  const excess = totalTokens(player.tokens) - MAX_TOKENS;
  const targets = targetCards(state, player, 3);

  // Usefulness per color = total remaining need across targets. Gold is precious.
  const usefulness = new Map<string, number>();
  for (const c of TOKEN_COLORS) usefulness.set(c, c === 'gold' ? 100 : 0);
  for (const card of targets) {
    const { byColor } = deficitFor(player, card);
    for (const c of GEM_COLORS) usefulness.set(c, (usefulness.get(c) ?? 0) + count(byColor, c));
  }

  const discards: TokenCounts = {};
  const held: [string, number][] = TOKEN_COLORS.map((c) => [c, count(player.tokens, c)]);
  for (let i = 0; i < excess; i++) {
    // Discard from the least useful color that still has tokens (after pending discards).
    let bestColor: string | null = null;
    let bestScore = Infinity;
    for (const [c, n] of held) {
      const left = n - (discards[c as GemColor] ?? 0);
      if (left <= 0) continue;
      const u = (usefulness.get(c) ?? 0) - left * 0.01; // prefer discarding from big piles
      if (u < bestScore) {
        bestScore = u;
        bestColor = c;
      }
    }
    if (!bestColor) break;
    discards[bestColor as GemColor] = (discards[bestColor as GemColor] ?? 0) + 1;
  }
  return discards;
}

/** All nobles are worth 3 — take the first qualifying one. */
export function chooseNoble(state: GameState): number {
  return qualifyingNobles(state, state.current)[0].id;
}

function findCard(state: GameState, cardId: number): Card | null {
  for (const row of state.market) {
    for (const card of row) if (card && card.id === cardId) return card;
  }
  return null;
}
