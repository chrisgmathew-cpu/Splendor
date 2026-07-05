import {
  Action,
  Card,
  GameState,
  GemCounts,
  GEM_COLORS,
  MAX_RESERVED,
  MAX_TOKENS,
  Noble,
  PlayerConfig,
  PlayerState,
  TokenColor,
  TokenCounts,
  TOKEN_COLORS,
  WINNING_POINTS,
} from './types';
import { ALL_CARDS, ALL_NOBLES } from './cards';

// ---------------------------------------------------------------------------
// Small counter helpers
// ---------------------------------------------------------------------------

export function count(counts: TokenCounts, color: TokenColor): number {
  return counts[color] ?? 0;
}

export function totalTokens(counts: TokenCounts): number {
  return TOKEN_COLORS.reduce((sum, c) => sum + count(counts, c), 0);
}

function addTokens(a: TokenCounts, b: TokenCounts, sign = 1): TokenCounts {
  const out: TokenCounts = { ...a };
  for (const c of TOKEN_COLORS) {
    const v = count(a, c) + sign * count(b, c);
    if (v > 0) out[c] = v;
    else delete out[c];
  }
  return out;
}

/** Sum of card bonuses a player owns, by color. */
export function bonuses(player: PlayerState): GemCounts {
  const out: GemCounts = {};
  for (const card of player.cards) {
    out[card.bonus] = (out[card.bonus] ?? 0) + 1;
  }
  return out;
}

/** Prestige points from cards and nobles. */
export function score(player: PlayerState): number {
  return (
    player.cards.reduce((s, c) => s + c.points, 0) +
    player.nobles.reduce((s, n) => s + n.points, 0)
  );
}

// ---------------------------------------------------------------------------
// Deterministic RNG (mulberry32) so games are reproducible from a seed
// ---------------------------------------------------------------------------

export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(items: T[], rng: () => number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

export function createGame(configs: PlayerConfig[], seed: number): GameState {
  const n = configs.length;
  if (n < 2 || n > 4) throw new Error('Splendor supports 2-4 players');
  const rng = makeRng(seed);

  const gemsPerColor = n === 2 ? 4 : n === 3 ? 5 : 7;
  const bank: TokenCounts = { gold: 5 };
  for (const c of GEM_COLORS) bank[c] = gemsPerColor;

  const decks: [Card[], Card[], Card[]] = [
    shuffled(ALL_CARDS.filter((c) => c.tier === 1), rng),
    shuffled(ALL_CARDS.filter((c) => c.tier === 2), rng),
    shuffled(ALL_CARDS.filter((c) => c.tier === 3), rng),
  ];
  const market: [(Card | null)[], (Card | null)[], (Card | null)[]] = [[], [], []];
  for (let t = 0; t < 3; t++) {
    for (let i = 0; i < 4; i++) market[t].push(decks[t].pop() ?? null);
  }

  const nobles = shuffled(ALL_NOBLES, rng).slice(0, n + 1);

  const players: PlayerState[] = configs.map((cfg) => ({
    name: cfg.name,
    kind: cfg.kind,
    difficulty: cfg.difficulty,
    tokens: {},
    cards: [],
    reserved: [],
    nobles: [],
  }));

  // Random opening player, like drawing for first turn at a real table.
  const startPlayer = Math.floor(rng() * n);

  return {
    players,
    current: startPlayer,
    startPlayer,
    phase: 'action',
    bank,
    decks,
    market,
    nobles,
    finalRound: false,
    triggeredBy: null,
    winners: null,
    turnCount: 0,
    log: [{ turn: 0, player: startPlayer, text: `${players[startPlayer].name} plays first` }],
  };
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function findMarketCard(state: GameState, cardId: number): Card | null {
  for (const row of state.market) {
    for (const card of row) if (card && card.id === cardId) return card;
  }
  return null;
}

/**
 * Payment required for `player` to buy `card`, or null if unaffordable.
 * Colored tokens are spent first; gold covers any remaining deficit.
 */
export function computePayment(player: PlayerState, card: Card): TokenCounts | null {
  const bonus = bonuses(player);
  const payment: TokenCounts = {};
  let goldNeeded = 0;
  for (const c of GEM_COLORS) {
    const need = Math.max(0, (card.cost[c] ?? 0) - (bonus[c] ?? 0));
    const fromTokens = Math.min(need, count(player.tokens, c));
    if (fromTokens > 0) payment[c] = fromTokens;
    goldNeeded += need - fromTokens;
  }
  if (goldNeeded > count(player.tokens, 'gold')) return null;
  if (goldNeeded > 0) payment.gold = goldNeeded;
  return payment;
}

export function canAfford(player: PlayerState, card: Card): boolean {
  return computePayment(player, card) !== null;
}

/** Nobles the current player qualifies for right now. */
export function qualifyingNobles(state: GameState, playerIdx: number): Noble[] {
  const bonus = bonuses(state.players[playerIdx]);
  return state.nobles.filter((n) =>
    GEM_COLORS.every((c) => (bonus[c] ?? 0) >= (n.requirement[c] ?? 0)),
  );
}

/** Validate an action without applying it. Returns an error string or null. */
export function validateAction(state: GameState, action: Action): string | null {
  if (state.phase !== 'action') return `Cannot act during ${state.phase} phase`;
  const player = state.players[state.current];

  switch (action.type) {
    case 'take3': {
      const colors = action.colors;
      if (colors.length < 1 || colors.length > 3) return 'Take 1-3 gems';
      if (new Set(colors).size !== colors.length) return 'Gems must be different colors';
      for (const c of colors) {
        if (count(state.bank, c) < 1) return `No ${c} gems left`;
      }
      // Taking fewer than 3 is only legal when no more distinct piles are available.
      if (colors.length < 3) {
        const available = GEM_COLORS.filter((c) => count(state.bank, c) > 0);
        if (available.length > colors.length)
          return 'You must take 3 different gems when available';
      }
      return null;
    }
    case 'take2': {
      if (count(state.bank, action.color) < 4)
        return 'Pile must have at least 4 gems to take 2';
      return null;
    }
    case 'reserve': {
      if (player.reserved.length >= MAX_RESERVED) return 'Already 3 cards reserved';
      if (action.cardId === null) {
        if (state.decks[action.tier - 1].length === 0) return 'That deck is empty';
      } else {
        const card = findMarketCard(state, action.cardId);
        if (!card || card.tier !== action.tier) return 'Card not available';
      }
      return null;
    }
    case 'buy': {
      const card =
        action.from === 'market'
          ? findMarketCard(state, action.cardId)
          : player.reserved.find((c) => c.id === action.cardId) ?? null;
      if (!card) return 'Card not available';
      if (!canAfford(player, card)) return 'Cannot afford this card';
      return null;
    }
    case 'pass': {
      if (legalActions(state).length > 0) return 'You must act if a legal action exists';
      return null;
    }
  }
}

// ---------------------------------------------------------------------------
// Applying actions — all functions return a NEW state
// ---------------------------------------------------------------------------

function clonePlayers(state: GameState): PlayerState[] {
  return state.players.map((p) => ({
    ...p,
    tokens: { ...p.tokens },
    cards: [...p.cards],
    reserved: [...p.reserved],
    nobles: [...p.nobles],
  }));
}

function refillMarket(state: GameState, tier: 1 | 2 | 3, slot: number): void {
  const deck = [...state.decks[tier - 1]];
  const row = [...state.market[tier - 1]];
  row[slot] = deck.pop() ?? null;
  state.decks = [...state.decks] as GameState['decks'];
  state.decks[tier - 1] = deck;
  state.market = [...state.market] as GameState['market'];
  state.market[tier - 1] = row;
}

function log(state: GameState, text: string): void {
  state.log = [...state.log, { turn: state.turnCount, player: state.current, text }];
}

export function applyAction(state: GameState, action: Action): GameState {
  const err = validateAction(state, action);
  if (err) throw new Error(err);

  const next: GameState = { ...state, players: clonePlayers(state), bank: { ...state.bank } };
  const player = next.players[next.current];

  switch (action.type) {
    case 'take3': {
      const gained: TokenCounts = {};
      for (const c of action.colors) gained[c] = 1;
      next.bank = addTokens(next.bank, gained, -1);
      player.tokens = addTokens(player.tokens, gained, +1);
      log(next, `${player.name} took ${action.colors.join(', ')}`);
      break;
    }
    case 'take2': {
      const gained: TokenCounts = { [action.color]: 2 };
      next.bank = addTokens(next.bank, gained, -1);
      player.tokens = addTokens(player.tokens, gained, +1);
      log(next, `${player.name} took 2 ${action.color}`);
      break;
    }
    case 'reserve': {
      let card: Card;
      if (action.cardId === null) {
        const deck = [...next.decks[action.tier - 1]];
        card = deck.pop()!;
        next.decks = [...next.decks] as GameState['decks'];
        next.decks[action.tier - 1] = deck;
        log(next, `${player.name} reserved a face-down tier ${action.tier} card`);
      } else {
        card = findMarketCard(next, action.cardId)!;
        const slot = next.market[action.tier - 1].findIndex((c) => c?.id === card.id);
        refillMarket(next, action.tier, slot);
        log(next, `${player.name} reserved a tier ${action.tier} card`);
      }
      player.reserved = [...player.reserved, card];
      if (count(next.bank, 'gold') > 0) {
        next.bank = addTokens(next.bank, { gold: 1 }, -1);
        player.tokens = addTokens(player.tokens, { gold: 1 }, +1);
      }
      break;
    }
    case 'buy': {
      const card =
        action.from === 'market'
          ? findMarketCard(next, action.cardId)!
          : player.reserved.find((c) => c.id === action.cardId)!;
      const payment = computePayment(player, card)!;
      player.tokens = addTokens(player.tokens, payment, -1);
      next.bank = addTokens(next.bank, payment, +1);
      if (action.from === 'market') {
        const slot = next.market[card.tier - 1].findIndex((c) => c?.id === card.id);
        refillMarket(next, card.tier, slot);
      } else {
        player.reserved = player.reserved.filter((c) => c.id !== card.id);
      }
      player.cards = [...player.cards, card];
      log(
        next,
        `${player.name} bought a tier ${card.tier} ${card.bonus} card` +
          (card.points ? ` (+${card.points} pts)` : ''),
      );
      break;
    }
    case 'pass': {
      log(next, `${player.name} passed`);
      break;
    }
  }

  return continueTurn(next);
}

/** After the main action (or a discard), resolve token limit, nobles, turn end. */
function continueTurn(state: GameState): GameState {
  const player = state.players[state.current];

  if (totalTokens(player.tokens) > MAX_TOKENS) {
    return { ...state, phase: 'discard' };
  }

  const qualified = qualifyingNobles(state, state.current);
  if (qualified.length === 1) {
    return endTurn(awardNoble(state, qualified[0].id));
  }
  if (qualified.length > 1) {
    return { ...state, phase: 'noble' };
  }
  return endTurn(state);
}

export function applyDiscard(state: GameState, discards: TokenCounts): GameState {
  if (state.phase !== 'discard') throw new Error('Not in discard phase');
  const next: GameState = { ...state, players: clonePlayers(state), bank: { ...state.bank } };
  const player = next.players[next.current];
  for (const c of TOKEN_COLORS) {
    if (count(discards, c) > count(player.tokens, c)) throw new Error('Discarding tokens you lack');
  }
  const total = totalTokens(player.tokens) - totalTokens(discards);
  if (total !== MAX_TOKENS) throw new Error(`Must discard down to exactly ${MAX_TOKENS}`);
  player.tokens = addTokens(player.tokens, discards, -1);
  next.bank = addTokens(next.bank, discards, +1);
  log(next, `${player.name} returned ${totalTokens(discards)} token(s)`);
  next.phase = 'action';
  return continueTurn(next);
}

export function applyNobleChoice(state: GameState, nobleId: number): GameState {
  if (state.phase !== 'noble') throw new Error('Not in noble phase');
  const qualified = qualifyingNobles(state, state.current);
  if (!qualified.some((n) => n.id === nobleId)) throw new Error('Noble not available');
  const next = awardNoble({ ...state, phase: 'action' }, nobleId);
  return endTurn(next);
}

function awardNoble(state: GameState, nobleId: number): GameState {
  const next: GameState = { ...state, players: clonePlayers(state) };
  const noble = next.nobles.find((n) => n.id === nobleId)!;
  next.nobles = next.nobles.filter((n) => n.id !== nobleId);
  const player = next.players[next.current];
  player.nobles = [...player.nobles, noble];
  log(next, `A noble visits ${player.name} (+3 pts)`);
  return next;
}

function endTurn(state: GameState): GameState {
  const next = { ...state };
  const playerScore = score(next.players[next.current]);

  if (!next.finalRound && playerScore >= WINNING_POINTS) {
    next.finalRound = true;
    next.triggeredBy = next.current;
    log(next, `${next.players[next.current].name} reached ${playerScore} points — final round!`);
  }

  const nextPlayer = (next.current + 1) % next.players.length;

  // The game ends once every player has had an equal number of turns,
  // i.e. when the turn would return to the opening player after the final
  // round began.
  if (next.finalRound && nextPlayer === next.startPlayer) {
    return finishGame(next);
  }

  next.current = nextPlayer;
  next.turnCount += 1;
  next.phase = 'action';
  return next;
}

function finishGame(state: GameState): GameState {
  const next = { ...state, phase: 'over' as const };
  const scores = next.players.map((p, i) => ({
    i,
    pts: score(p),
    cards: p.cards.length,
  }));
  const best = Math.max(...scores.map((s) => s.pts));
  const top = scores.filter((s) => s.pts === best);
  const fewest = Math.min(...top.map((s) => s.cards));
  next.winners = top.filter((s) => s.cards === fewest).map((s) => s.i);
  const names = next.winners.map((i) => next.players[i].name).join(' & ');
  log(next, `Game over — ${names} win${next.winners.length > 1 ? '' : 's'} with ${best} points!`);
  return next;
}

// ---------------------------------------------------------------------------
// Move generation (used by the AI and for UI hints)
// ---------------------------------------------------------------------------

export function legalActions(state: GameState): Action[] {
  if (state.phase !== 'action') return [];
  const player = state.players[state.current];
  const actions: Action[] = [];

  // Buys — market and reserved.
  for (const row of state.market) {
    for (const card of row) {
      if (card && canAfford(player, card)) {
        actions.push({ type: 'buy', cardId: card.id, from: 'market' });
      }
    }
  }
  for (const card of player.reserved) {
    if (canAfford(player, card)) {
      actions.push({ type: 'buy', cardId: card.id, from: 'reserved' });
    }
  }

  // Take 3 different (or as many distinct piles as exist).
  const available = GEM_COLORS.filter((c) => count(state.bank, c) > 0);
  const k = Math.min(3, available.length);
  if (k > 0) {
    const combos = combinations(available, k);
    for (const colors of combos) actions.push({ type: 'take3', colors });
  }

  // Take 2 same.
  for (const c of GEM_COLORS) {
    if (count(state.bank, c) >= 4) actions.push({ type: 'take2', color: c });
  }

  // Reserves (face-up only; blind reserves excluded from AI move list for simplicity,
  // but still legal via validateAction).
  if (player.reserved.length < MAX_RESERVED) {
    for (const row of state.market) {
      for (const card of row) {
        if (card) actions.push({ type: 'reserve', tier: card.tier, cardId: card.id });
      }
    }
  }

  return actions;
}

function combinations<T>(items: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (items.length < k) return [];
  const [first, ...rest] = items;
  const withFirst = combinations(rest, k - 1).map((c) => [first, ...c]);
  return [...withFirst, ...combinations(rest, k)];
}
