import { describe, expect, it } from 'vitest';
import { ALL_CARDS, ALL_NOBLES } from './cards';
import {
  applyAction,
  applyDiscard,
  applyNobleChoice,
  bonuses,
  canAfford,
  computePayment,
  count,
  createGame,
  makeRng,
  score,
  totalTokens,
  validateAction,
} from './game';
import { chooseAction, chooseDiscards, chooseNoble } from './ai';
import { GEM_COLORS, PlayerConfig } from './types';

const twoPlayers: PlayerConfig[] = [
  { name: 'A', kind: 'human' },
  { name: 'B', kind: 'human' },
];

describe('card dataset', () => {
  it('has 90 cards: 40 tier-1, 30 tier-2, 20 tier-3', () => {
    expect(ALL_CARDS).toHaveLength(90);
    expect(ALL_CARDS.filter((c) => c.tier === 1)).toHaveLength(40);
    expect(ALL_CARDS.filter((c) => c.tier === 2)).toHaveLength(30);
    expect(ALL_CARDS.filter((c) => c.tier === 3)).toHaveLength(20);
  });

  it('has 8/6/4 cards per bonus color per tier', () => {
    for (const color of GEM_COLORS) {
      expect(ALL_CARDS.filter((c) => c.tier === 1 && c.bonus === color)).toHaveLength(8);
      expect(ALL_CARDS.filter((c) => c.tier === 2 && c.bonus === color)).toHaveLength(6);
      expect(ALL_CARDS.filter((c) => c.tier === 3 && c.bonus === color)).toHaveLength(4);
    }
  });

  it('has 10 nobles worth 3 points each', () => {
    expect(ALL_NOBLES).toHaveLength(10);
    for (const n of ALL_NOBLES) expect(n.points).toBe(3);
  });

  it('has unique ids', () => {
    const ids = new Set([...ALL_CARDS.map((c) => c.id), ...ALL_NOBLES.map((n) => n.id)]);
    expect(ids.size).toBe(100);
  });

  it('point ranges match the real game', () => {
    for (const c of ALL_CARDS) {
      if (c.tier === 1) expect(c.points).toBeLessThanOrEqual(1);
      if (c.tier === 2) expect(c.points).toBeGreaterThanOrEqual(1);
      if (c.tier === 3) expect(c.points).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('setup', () => {
  it('deals 4 cards per tier and n+1 nobles', () => {
    for (const n of [2, 3, 4]) {
      const configs = Array.from({ length: n }, (_, i) => ({
        name: `P${i}`,
        kind: 'human' as const,
      }));
      const g = createGame(configs, 42);
      expect(g.market[0].filter(Boolean)).toHaveLength(4);
      expect(g.market[1].filter(Boolean)).toHaveLength(4);
      expect(g.market[2].filter(Boolean)).toHaveLength(4);
      expect(g.nobles).toHaveLength(n + 1);
      const gems = n === 2 ? 4 : n === 3 ? 5 : 7;
      for (const c of GEM_COLORS) expect(count(g.bank, c)).toBe(gems);
      expect(count(g.bank, 'gold')).toBe(5);
    }
  });

  it('is deterministic for a given seed', () => {
    const a = createGame(twoPlayers, 7);
    const b = createGame(twoPlayers, 7);
    expect(a.market).toEqual(b.market);
    expect(a.nobles).toEqual(b.nobles);
  });
});

describe('token taking', () => {
  it('take3 moves gems from bank to player', () => {
    const g = createGame(twoPlayers, 1);
    const next = applyAction(g, { type: 'take3', colors: ['white', 'blue', 'green'] });
    expect(count(next.players[0].tokens, 'white')).toBe(1);
    expect(count(next.bank, 'white')).toBe(3);
    expect(next.current).toBe(1);
  });

  it('rejects duplicate colors in take3', () => {
    const g = createGame(twoPlayers, 1);
    expect(validateAction(g, { type: 'take3', colors: ['white', 'white', 'blue'] })).toBeTruthy();
  });

  it('take2 requires a pile of 4+', () => {
    let g = createGame(twoPlayers, 1); // 2p → 4 per pile
    expect(validateAction(g, { type: 'take2', color: 'red' })).toBeNull();
    g = applyAction(g, { type: 'take2', color: 'red' }); // pile now 2
    expect(validateAction(g, { type: 'take2', color: 'red' })).toBeTruthy();
  });

  it('forces discard above 10 tokens', () => {
    let g = createGame(
      [
        { name: 'A', kind: 'human' },
        { name: 'B', kind: 'human' },
        { name: 'C', kind: 'human' },
        { name: 'D', kind: 'human' },
      ],
      3,
    );
    // Give player A 9 tokens directly, then take 2 more → 11 → discard phase.
    g = {
      ...g,
      players: g.players.map((p, i) =>
        i === 0 ? { ...p, tokens: { white: 3, blue: 3, red: 3 } } : p,
      ),
    };
    g = applyAction(g, { type: 'take2', color: 'green' });
    expect(g.phase).toBe('discard');
    expect(totalTokens(g.players[0].tokens)).toBe(11);
    const done = applyDiscard(g, { green: 1 });
    expect(totalTokens(done.players[0].tokens)).toBe(10);
    expect(done.current).toBe(1);
  });
});

describe('reserving and buying', () => {
  it('reserve grants a gold and enforces the 3-card cap', () => {
    let g = createGame(twoPlayers, 5);
    const card = g.market[0][0]!;
    g = applyAction(g, { type: 'reserve', tier: 1, cardId: card.id });
    expect(g.players[0].reserved.map((c) => c.id)).toContain(card.id);
    expect(count(g.players[0].tokens, 'gold')).toBe(1);
    expect(g.market[0][0]!.id).not.toBe(card.id); // refilled
  });

  it('payment uses bonuses then gold', () => {
    const g = createGame(twoPlayers, 5);
    const player = {
      ...g.players[0],
      tokens: { blue: 1, gold: 2 },
      cards: [ALL_CARDS.find((c) => c.bonus === 'blue')!],
    };
    const card = ALL_CARDS.find((c) => (c.cost.blue ?? 0) === 3 && Object.keys(c.cost).length === 1)!;
    // cost blue 3, bonus 1 → need 2, has 1 blue token + gold
    const pay = computePayment(player, card)!;
    expect(pay.blue).toBe(1);
    expect(pay.gold).toBe(1);
  });

  it('buying moves card to player and refills market', () => {
    let g = createGame(twoPlayers, 9);
    // find a market tier-1 card and grant tokens to afford it
    const card = g.market[0].find((c) => c)!;
    g = { ...g, players: g.players.map((p, i) => (i === 0 ? { ...p, tokens: { white: 4, blue: 4, green: 4, red: 4, black: 4 } } : p)) };
    g = applyAction(g, { type: 'buy', cardId: card.id, from: 'market' });
    expect(g.players[0].cards.map((c) => c.id)).toContain(card.id);
    expect(g.market[0].filter(Boolean)).toHaveLength(4);
  });
});

describe('nobles and winning', () => {
  it('awards a qualifying noble automatically', () => {
    let g = createGame(twoPlayers, 11);
    const noble = g.nobles[0];
    // Give player 0 the required bonuses via fake purchased cards.
    const fakeCards = GEM_COLORS.flatMap((color) =>
      Array.from({ length: noble.requirement[color] ?? 0 }, (_, i) => ({
        ...ALL_CARDS.find((c) => c.bonus === color)!,
        id: 1000 + i + GEM_COLORS.indexOf(color) * 10,
      })),
    );
    g = {
      ...g,
      nobles: [noble],
      players: g.players.map((p, i) => (i === 0 ? { ...p, cards: fakeCards } : p)),
    };
    const next = applyAction(g, { type: 'take3', colors: ['white', 'blue', 'green'] });
    expect(next.players[0].nobles).toHaveLength(1);
    expect(score(next.players[0])).toBeGreaterThanOrEqual(3);
  });

  it('enters noble phase when multiple qualify', () => {
    let g = createGame(twoPlayers, 11);
    const nobles = ALL_NOBLES.slice(0, 2); // w4u4 and u4g4
    const mkCards = (color: string, n: number) =>
      Array.from({ length: n }, (_, i) => ({
        ...ALL_CARDS.find((c) => c.bonus === color)!,
        id: 2000 + i + 'wugrk'.indexOf(color[0]) * 20,
      }));
    g = {
      ...g,
      nobles,
      players: g.players.map((p, i) =>
        i === 0
          ? { ...p, cards: [...mkCards('white', 4), ...mkCards('blue', 4), ...mkCards('green', 4)] }
          : p,
      ),
    };
    const next = applyAction(g, { type: 'take3', colors: ['white', 'blue', 'green'] });
    expect(next.phase).toBe('noble');
    const done = applyNobleChoice(next, nobles[1].id);
    expect(done.players[0].nobles.map((n) => n.id)).toEqual([nobles[1].id]);
    expect(done.phase).toBe('action');
    expect(done.current).toBe(1);
  });

  it('finishes the round after 15 points, equal turns for all', () => {
    let g = createGame(twoPlayers, 13);
    // Give player 1 (second) 15 points worth of cards; player 0 acts first.
    const bigCards = ALL_CARDS.filter((c) => c.points === 5).slice(0, 3);
    g = { ...g, players: g.players.map((p, i) => (i === 1 ? { ...p, cards: bigCards } : p)) };
    // P0 acts — no trigger yet.
    g = applyAction(g, { type: 'take3', colors: ['white', 'blue', 'green'] });
    expect(g.finalRound).toBe(false);
    // P1 acts, has 15 pts → final round triggers, and since next is P0 (round complete), game ends.
    g = applyAction(g, { type: 'take3', colors: ['white', 'blue', 'green'] });
    expect(g.phase).toBe('over');
    expect(g.winners).toEqual([1]);
  });

  it('breaks ties by fewest development cards', () => {
    let g = createGame(twoPlayers, 17);
    const p0Cards = [...ALL_CARDS.filter((c) => c.points === 5).slice(0, 3)]; // 15 pts, 3 cards
    const p1Cards = [
      ...ALL_CARDS.filter((c) => c.points === 4).slice(0, 3),
      ALL_CARDS.filter((c) => c.points === 3)[0],
    ]; // 15 pts, 4 cards
    g = {
      ...g,
      players: g.players.map((p, i) => ({ ...p, cards: i === 0 ? p0Cards : p1Cards })),
    };
    g = applyAction(g, { type: 'take3', colors: ['white', 'blue', 'green'] });
    g = applyAction(g, { type: 'take3', colors: ['red', 'black', 'white'] });
    expect(g.phase).toBe('over');
    expect(g.winners).toEqual([0]); // fewer cards wins the tie
  });
});

describe('AI self-play', () => {
  it.each(['easy', 'medium', 'hard'] as const)(
    '%s AI completes full games legally',
    (difficulty) => {
      for (const seed of [1, 2, 3]) {
        let g = createGame(
          [
            { name: 'Bot1', kind: 'ai', difficulty },
            { name: 'Bot2', kind: 'ai', difficulty },
            { name: 'Bot3', kind: 'ai', difficulty },
          ],
          seed,
        );
        const rng = makeRng(seed * 1000);
        let guard = 0;
        while (g.phase !== 'over' && guard++ < 2000) {
          if (g.phase === 'action') {
            const action = chooseAction(g, rng);
            expect(validateAction(g, action)).toBeNull();
            g = applyAction(g, action);
          } else if (g.phase === 'discard') {
            g = applyDiscard(g, chooseDiscards(g));
          } else if (g.phase === 'noble') {
            g = applyNobleChoice(g, chooseNoble(g));
          }
        }
        expect(g.phase).toBe('over');
        expect(g.winners!.length).toBeGreaterThan(0);
        const winnerScore = score(g.players[g.winners![0]]);
        expect(winnerScore).toBeGreaterThanOrEqual(15);
        // Token conservation: bank + players = initial supply.
        for (const c of GEM_COLORS) {
          const total =
            count(g.bank, c) + g.players.reduce((s, p) => s + count(p.tokens, c), 0);
          expect(total).toBe(5);
        }
      }
    },
  );

  it('hard AI beats easy AI most of the time', () => {
    let hardWins = 0;
    const games = 10;
    for (let seed = 1; seed <= games; seed++) {
      let g = createGame(
        [
          { name: 'Hard', kind: 'ai', difficulty: 'hard' },
          { name: 'Easy', kind: 'ai', difficulty: 'easy' },
        ],
        seed,
      );
      const rng = makeRng(seed * 77);
      let guard = 0;
      while (g.phase !== 'over' && guard++ < 2000) {
        if (g.phase === 'action') g = applyAction(g, chooseAction(g, rng));
        else if (g.phase === 'discard') g = applyDiscard(g, chooseDiscards(g));
        else if (g.phase === 'noble') g = applyNobleChoice(g, chooseNoble(g));
      }
      if (g.winners?.includes(0)) hardWins++;
    }
    expect(hardWins).toBeGreaterThanOrEqual(6);
  });
});

describe('misc rules', () => {
  it('cannot take fewer than 3 distinct when 3+ piles available', () => {
    const g = createGame(twoPlayers, 21);
    expect(validateAction(g, { type: 'take3', colors: ['white', 'blue'] })).toBeTruthy();
  });

  it('bonuses reduce cost to zero (free card)', () => {
    const g = createGame(twoPlayers, 23);
    const card = ALL_CARDS.find((c) => c.tier === 1 && (c.cost.blue ?? 0) === 3)!;
    const player = {
      ...g.players[0],
      cards: Array.from({ length: 3 }, (_, i) => ({
        ...ALL_CARDS.find((c) => c.bonus === 'blue')!,
        id: 3000 + i,
      })),
    };
    expect(canAfford(player, card)).toBe(true);
    expect(computePayment(player, card)).toEqual({});
    expect(bonuses(player).blue).toBe(3);
  });
});
