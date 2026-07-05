/** The five gem colors plus gold (joker). */
export type GemColor = 'white' | 'blue' | 'green' | 'red' | 'black';
export type TokenColor = GemColor | 'gold';

export const GEM_COLORS: GemColor[] = ['white', 'blue', 'green', 'red', 'black'];
export const TOKEN_COLORS: TokenColor[] = [...GEM_COLORS, 'gold'];

/** Counts per color; missing keys mean zero. */
export type GemCounts = Partial<Record<GemColor, number>>;
export type TokenCounts = Partial<Record<TokenColor, number>>;

export interface Card {
  id: number;
  tier: 1 | 2 | 3;
  bonus: GemColor;
  points: number;
  cost: GemCounts;
}

export interface Noble {
  id: number;
  points: number; // always 3 in base game
  requirement: GemCounts; // required card bonuses
}

export type PlayerKind = 'human' | 'ai';
export type AiDifficulty = 'easy' | 'medium' | 'hard';

export interface PlayerConfig {
  name: string;
  kind: PlayerKind;
  difficulty?: AiDifficulty;
}

export interface PlayerState {
  name: string;
  kind: PlayerKind;
  difficulty?: AiDifficulty;
  tokens: TokenCounts;
  /** Purchased development cards. */
  cards: Card[];
  /** Reserved cards (max 3). */
  reserved: Card[];
  nobles: Noble[];
}

/**
 * Turn phases: normally 'action'; 'discard' when the acting player exceeded
 * 10 tokens; 'noble' when more than one noble qualifies and the player must
 * choose; 'over' when the game has ended.
 */
export type Phase = 'action' | 'discard' | 'noble' | 'over';

export interface GameState {
  players: PlayerState[];
  /** Index of the player whose turn it is. */
  current: number;
  /** Who opened the game (randomized); the final round ends before them. */
  startPlayer: number;
  phase: Phase;
  bank: TokenCounts;
  /** Face-down decks per tier (index 0 = tier 1). */
  decks: [Card[], Card[], Card[]];
  /** Face-up market per tier, up to 4 cards each (null = empty slot). */
  market: [(Card | null)[], (Card | null)[], (Card | null)[]];
  nobles: Noble[];
  /** Set once a player reaches 15 points; the round is finished out. */
  finalRound: boolean;
  /** Index of the player who triggered the final round. */
  triggeredBy: number | null;
  /** Winner indices (ties possible only after tiebreaker) once game over. */
  winners: number[] | null;
  turnCount: number;
  /** Monotonic log of notable events for the UI. */
  log: LogEntry[];
}

export interface LogEntry {
  turn: number;
  player: number;
  text: string;
}

/** A player turn action. */
export type Action =
  | { type: 'take3'; colors: GemColor[] } // 1-3 distinct colors (fewer if bank limited)
  | { type: 'take2'; color: GemColor } // pile must have >= 4
  | { type: 'reserve'; tier: 1 | 2 | 3; cardId: number | null } // null = blind from deck top
  | { type: 'buy'; cardId: number; from: 'market' | 'reserved' }
  /** Only legal when no other action is possible. */
  | { type: 'pass' };

export const WINNING_POINTS = 15;
export const MAX_TOKENS = 10;
export const MAX_RESERVED = 3;
