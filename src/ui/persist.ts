import { GameState } from '../engine/types';

/**
 * Autosave: the full game state is plain JSON, so we persist it on every
 * change and restore it on load. Storage access is wrapped because sandboxed
 * hosts (e.g. the artifact viewer) may deny localStorage.
 */

const KEY = 'splendor-save';
const VERSION = 2; // v2: GameState gained startPlayer

interface SaveFile {
  version: number;
  seed: number;
  savedAt: number;
  state: GameState;
}

export function saveGame(state: GameState, seed: number): void {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({ version: VERSION, seed, savedAt: Date.now(), state } satisfies SaveFile),
    );
  } catch {
    /* storage unavailable */
  }
}

export function loadGame(): { state: GameState; seed: number } | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const save = JSON.parse(raw) as SaveFile;
    if (save.version !== VERSION) return null;
    const s = save.state;
    // Light sanity checks so a corrupted save can't crash the game.
    if (!Array.isArray(s?.players) || s.players.length < 2 || s.players.length > 4) return null;
    if (!Array.isArray(s.decks) || s.decks.length !== 3 || !Array.isArray(s.market)) return null;
    if (typeof s.current !== 'number' || !s.players[s.current]) return null;
    if (typeof s.startPlayer !== 'number' || !s.players[s.startPlayer]) return null;
    if (s.phase === 'over') return null; // finished games aren't worth resuming
    return { state: s, seed: save.seed >>> 0 };
  } catch {
    return null;
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
