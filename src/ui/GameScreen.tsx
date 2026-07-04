import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Action,
  Card,
  GameState,
  GemColor,
  MAX_RESERVED,
  MAX_TOKENS,
  PlayerConfig,
  TokenColor,
  TOKEN_COLORS,
} from '../engine/types';
import {
  applyAction,
  applyDiscard,
  applyNobleChoice,
  canAfford,
  count,
  createGame,
  legalActions,
  makeRng,
  qualifyingNobles,
  score,
  totalTokens,
  validateAction,
} from '../engine/game';
import { chooseAction, chooseDiscards, chooseNoble } from '../engine/ai';
import { GEM_LABEL, TokenChip } from './Gem';
import { cardBackImg } from './assets';
import { clearSave, saveGame } from './persist';
import { CardView } from './CardView';
import { NobleView } from './NobleView';
import { PlayerPanel } from './PlayerPanel';
import { flyClone, flyCloneMany, pulse } from './fly';

const AI_DELAY = 1000;
const FIT_KEY = 'splendor-fit';

function initialFit(): boolean {
  try {
    const saved = localStorage.getItem(FIT_KEY);
    if (saved !== null) return saved === '1';
  } catch {
    /* storage unavailable (sandboxed host) */
  }
  return window.matchMedia('(max-width: 760px), (max-height: 540px)').matches;
}

interface Banner {
  title: string;
  sub?: string;
}

export function GameScreen({
  players,
  seed,
  initialState,
  onExit,
}: {
  players: PlayerConfig[];
  seed: number;
  initialState?: GameState;
  onExit: () => void;
}) {
  const [state, setState] = useState<GameState>(() => initialState ?? createGame(players, seed));
  const [selectedTokens, setSelectedTokens] = useState<GemColor[]>([]);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [selectedReserved, setSelectedReserved] = useState<number | null>(null);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [fit, setFit] = useState<boolean>(initialFit);
  const rngRef = useRef(makeRng(seed ^ 0x9e3779b9));

  const toggleFit = () =>
    setFit((f) => {
      try {
        localStorage.setItem(FIT_KEY, f ? '0' : '1');
      } catch {
        /* ignore */
      }
      return !f;
    });
  const bannerTimer = useRef<number | undefined>(undefined);

  const current = state.players[state.current];
  const isHumanTurn = current.kind === 'human' && state.phase === 'action';
  const humanDiscard = current.kind === 'human' && state.phase === 'discard';
  const humanNoble = current.kind === 'human' && state.phase === 'noble';
  const aiTurn = current.kind === 'ai' && state.phase !== 'over';

  // Autosave after every change; a finished game clears the save.
  useEffect(() => {
    if (state.phase === 'over') clearSave();
    else saveGame(state, seed);
  }, [state, seed]);

  const showBanner = useCallback((b: Banner, ms = 1900) => {
    setBanner(b);
    window.clearTimeout(bannerTimer.current);
    bannerTimer.current = window.setTimeout(() => setBanner(null), ms);
  }, []);

  const clearSelection = () => {
    setSelectedTokens([]);
    setSelectedCard(null);
    setSelectedReserved(null);
  };

  /** Apply an action with flying-gem/card effects and event banners. */
  const applyWithFx = useCallback(
    (action: Action) => {
      setState((prev) => {
        if (validateAction(prev, action)) return prev; // stale click — ignore
        const idx = prev.current;
        const target = `player-${idx}`;

        // Fire animations from the still-mounted source elements.
        if (action.type === 'take3') {
          action.colors.forEach((c, i) =>
            flyClone(document.querySelector(`[data-gem-pile="${c}"] .token-chip`), target, {
              delay: i * 90,
              scale: 0.7,
              fadeOut: true,
            }),
          );
        } else if (action.type === 'take2') {
          flyCloneMany(
            document.querySelector(`[data-gem-pile="${action.color}"] .token-chip`),
            target,
            2,
            { scale: 0.7, fadeOut: true },
          );
        } else if (action.type === 'buy') {
          flyClone(document.querySelector(`[data-card-id="${action.cardId}"]`), target, {
            scale: 0.35,
            fadeOut: true,
            duration: 700,
          });
        } else if (action.type === 'reserve') {
          if (action.cardId !== null) {
            flyClone(document.querySelector(`[data-card-id="${action.cardId}"]`), target, {
              scale: 0.5,
              fadeOut: true,
            });
          } else {
            flyClone(document.querySelector(`[data-deck="${action.tier}"]`), target, {
              scale: 0.5,
              fadeOut: true,
            });
          }
          flyClone(document.querySelector(`[data-gem-pile="gold"] .token-chip`), target, {
            delay: 140,
            scale: 0.7,
            fadeOut: true,
          });
        }
        window.setTimeout(() => pulse(target), 550);

        const next = applyAction(prev, action);

        // Event banners.
        const prevNobles = prev.players[idx].nobles.length;
        if (next.players[idx].nobles.length > prevNobles) {
          showBanner({ title: '♛ A Noble Visits', sub: `+3 prestige for ${prev.players[idx].name}` });
        } else if (!prev.finalRound && next.finalRound) {
          showBanner({
            title: 'Final Round',
            sub: `${next.players[next.triggeredBy!].name} reached 15 points`,
          });
        }
        return next;
      });
      clearSelection();
    },
    [showBanner],
  );

  // ------------------------------------------------------------------
  // AI turns
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!aiTurn) return;
    const t = window.setTimeout(() => {
      if (state.phase === 'action') {
        applyWithFx(chooseAction(state, rngRef.current));
      } else if (state.phase === 'discard') {
        setState((prev) => (prev.phase === 'discard' ? applyDiscard(prev, chooseDiscards(prev)) : prev));
      } else if (state.phase === 'noble') {
        setState((prev) => {
          if (prev.phase !== 'noble') return prev;
          const next = applyNobleChoice(prev, chooseNoble(prev));
          showBanner({ title: '♛ A Noble Visits', sub: `+3 prestige for ${prev.players[prev.current].name}` });
          return next;
        });
      }
    }, AI_DELAY);
    return () => window.clearTimeout(t);
  }, [state, aiTurn, applyWithFx, showBanner]);

  // ------------------------------------------------------------------
  // Token selection (human)
  // ------------------------------------------------------------------
  const toggleToken = (color: GemColor) => {
    if (!isHumanTurn) return;
    setSelectedCard(null);
    setSelectedReserved(null);
    setSelectedTokens((sel) => {
      const isPair = sel.length === 2 && sel[0] === sel[1];
      const has = sel.includes(color);
      if (isPair) return sel[0] === color ? [] : [color];
      if (has) {
        // Second click on the same single color → take-2 if the pile allows it.
        if (sel.length === 1 && count(state.bank, color) >= 4) return [color, color];
        return sel.filter((c) => c !== color);
      }
      if (sel.length >= 3) return sel;
      return [...sel, color];
    });
  };

  const pendingTakeAction: Action | null = useMemo(() => {
    if (selectedTokens.length === 0) return null;
    if (selectedTokens.length === 2 && selectedTokens[0] === selectedTokens[1]) {
      return { type: 'take2', color: selectedTokens[0] };
    }
    return { type: 'take3', colors: selectedTokens };
  }, [selectedTokens]);

  const takeError = pendingTakeAction ? validateAction(state, pendingTakeAction) : null;

  // ------------------------------------------------------------------
  // Human discard flow
  // ------------------------------------------------------------------
  const [pendingDiscards, setPendingDiscards] = useState<Partial<Record<TokenColor, number>>>({});
  const discardTotal = TOKEN_COLORS.reduce((s, c) => s + (pendingDiscards[c] ?? 0), 0);
  const overBy = humanDiscard
    ? totalTokens(current.tokens) - MAX_TOKENS - discardTotal
    : 0;

  useEffect(() => {
    if (!humanDiscard) setPendingDiscards({});
  }, [humanDiscard]);

  const clickDiscardToken = (color: TokenColor) => {
    if (!humanDiscard || overBy <= 0) return;
    if ((pendingDiscards[color] ?? 0) >= count(current.tokens, color)) return;
    flyClone(
      document.querySelector(`[data-fly-target="player-${state.current}-tokens"] .token-chip`),
      `bank-${color}`,
      { scale: 0.8, fadeOut: true },
    );
    setPendingDiscards((d) => ({ ...d, [color]: (d[color] ?? 0) + 1 }));
  };

  useEffect(() => {
    if (humanDiscard && overBy === 0 && discardTotal > 0) {
      setState((prev) => (prev.phase === 'discard' ? applyDiscard(prev, pendingDiscards) : prev));
      setPendingDiscards({});
    }
  }, [humanDiscard, overBy, discardTotal, pendingDiscards]);

  // ------------------------------------------------------------------
  // Card interactions (human)
  // ------------------------------------------------------------------
  const marketCardClick = (card: Card) => {
    if (!isHumanTurn) return;
    setSelectedTokens([]);
    setSelectedReserved(null);
    setSelectedCard((id) => (id === card.id ? null : card.id));
  };

  const buySelected = (card: Card) => applyWithFx({ type: 'buy', cardId: card.id, from: 'market' });
  const reserveSelected = (card: Card) =>
    applyWithFx({ type: 'reserve', tier: card.tier, cardId: card.id });

  const reservedClick = (card: Card) => {
    if (!isHumanTurn) return;
    setSelectedTokens([]);
    setSelectedCard(null);
    setSelectedReserved((id) => (id === card.id ? null : card.id));
  };

  const mustPass = isHumanTurn && legalActions(state).length === 0;

  // ------------------------------------------------------------------
  // Status line
  // ------------------------------------------------------------------
  const status = (() => {
    if (state.phase === 'over') {
      const names = state.winners!.map((i) => state.players[i].name).join(' & ');
      return (
        <>
          <span className="status-strong">{names}</span> wins the game!
        </>
      );
    }
    if (aiTurn)
      return (
        <>
          <span className="status-strong">{current.name}</span> is plotting
          <span className="thinking-dots">
            <span />
            <span />
            <span />
          </span>
        </>
      );
    if (humanDiscard)
      return (
        <>
          <span className="status-strong">{current.name}</span> — over the {MAX_TOKENS}-token limit
        </>
      );
    if (humanNoble)
      return (
        <>
          <span className="status-strong">{current.name}</span> — choose a noble
        </>
      );
    if (mustPass)
      return (
        <>
          No legal moves —{' '}
          <button className="icon-btn" onClick={() => applyWithFx({ type: 'pass' })}>
            Pass
          </button>
        </>
      );
    return (
      <>
        <span className="status-strong">{current.name}</span>
        {state.finalRound ? ' — final round' : ''} — take gems, or pick a card to buy or reserve
      </>
    );
  })();

  return (
    <div className={`game-screen ${fit ? 'fit' : ''}`}>
      <div className="game-topbar">
        <h1 className="gold-text">Splendor</h1>
        <div className="topbar-status">{status}</div>
        <button
          className="icon-btn"
          onClick={toggleFit}
          title={fit ? 'Fit to screen: on — tap for full layout with scrolling' : 'Fit everything on screen without scrolling'}
        >
          ⛶ {fit ? 'Fit ✓' : 'Fit'}
        </button>
        <button className="icon-btn" onClick={onExit}>
          ↩ New Game
        </button>
      </div>

      <div className="game-main">
        {/* Token bank */}
        <div className="bank-column">
          <span className="bank-title">Bank</span>
          {TOKEN_COLORS.map((c: TokenColor) => {
            const n = count(state.bank, c);
            const selCount = c === 'gold' ? 0 : selectedTokens.filter((x) => x === c).length;
            const selectable = isHumanTurn && c !== 'gold' && n > 0;
            return (
              <button
                key={c}
                className={`token-pile ${selCount > 0 ? 'selected' : ''} ${n === 0 ? 'depleted' : ''}`}
                disabled={!selectable}
                data-gem-pile={c}
                data-fly-target={`bank-${c}`}
                title={`${GEM_LABEL[c]} — ${n} left${c === 'gold' ? ' (reserve a card to gain gold)' : ''}`}
                onClick={() => c !== 'gold' && toggleToken(c)}
              >
                <TokenChip color={c} />
                <span className="token-count">{n}</span>
                {selCount > 0 && <span className="sel-badge">{selCount}</span>}
              </button>
            );
          })}
          {pendingTakeAction && (
            <div className="take-confirm">
              <button
                className="confirm-btn"
                disabled={!!takeError}
                title={takeError ?? ''}
                onClick={() => applyWithFx(pendingTakeAction)}
              >
                {takeError ? 'Invalid' : 'Take gems'}
              </button>
              <button className="cancel-btn" onClick={() => setSelectedTokens([])}>
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Board center */}
        <div className="board-center">
          <div className="nobles-row">
            {state.nobles.map((n, i) => (
              <NobleView key={n.id} noble={n} dealDelay={i * 120} />
            ))}
          </div>

          <div className="card-grid">
            {[2, 1, 0].map((tierIdx) => {
              const tier = (tierIdx + 1) as 1 | 2 | 3;
              const deck = state.decks[tierIdx];
              const canReserveBlind =
                isHumanTurn && deck.length > 0 && current.reserved.length < MAX_RESERVED;
              return (
                <div className="tier-row" key={tier}>
                  <button
                    className={`deck-stack ${deck.length === 0 ? 'empty' : ''}`}
                    data-deck={tier}
                    disabled={!canReserveBlind}
                    title={
                      canReserveBlind
                        ? `Reserve the top card of the tier ${tier} deck (blind)`
                        : `Tier ${tier} deck`
                    }
                    onClick={() => applyWithFx({ type: 'reserve', tier, cardId: null })}
                  >
                    {(() => {
                      const back = cardBackImg(tier);
                      const style = back
                        ? { backgroundImage: `url(${back})` }
                        : undefined;
                      const cls = back ? 'deck-card art' : 'deck-card';
                      return (
                        <>
                          <span className={`${cls} deck-under2`} style={style} />
                          <span className={`${cls} deck-under`} style={style} />
                          <span className={cls} style={style} />
                        </>
                      );
                    })()}
                    <span className="deck-tier-label">{'◆'.repeat(tier)}</span>
                    <span className="deck-count">{deck.length}</span>
                  </button>
                  {state.market[tierIdx].map((card, slot) =>
                    card ? (
                      <CardView
                        key={card.id}
                        card={card}
                        affordable={isHumanTurn && canAfford(current, card)}
                        selected={selectedCard === card.id}
                        dealDelay={slot * 90}
                        onClick={() => marketCardClick(card)}
                      >
                        {selectedCard === card.id && (
                          <span className="card-actions" onClick={(e) => e.stopPropagation()}>
                            <button
                              className="buy"
                              disabled={!canAfford(current, card)}
                              onClick={() => buySelected(card)}
                            >
                              Buy
                            </button>
                            <button
                              className="reserve"
                              disabled={current.reserved.length >= MAX_RESERVED}
                              onClick={() => reserveSelected(card)}
                            >
                              Reserve
                            </button>
                          </span>
                        )}
                      </CardView>
                    ) : (
                      <div key={`empty-${tier}-${slot}`} className="dev-card" style={{ opacity: 0.12 }} />
                    ),
                  )}
                </div>
              );
            })}
          </div>

          <div className="game-log">
            {state.log.slice(-5).map((e, i, arr) => (
              <div key={`${e.turn}-${i}`} className={i === arr.length - 1 ? 'latest' : ''}>
                {e.text}
              </div>
            ))}
          </div>
        </div>

        {/* Players */}
        <div className="players-column">
          {state.players.map((p, i) => (
            <PlayerPanel
              key={i}
              player={p}
              index={i}
              active={i === state.current && state.phase !== 'over'}
              isThinking={i === state.current && aiTurn}
              discardMode={humanDiscard && i === state.current}
              onDiscardToken={clickDiscardToken}
              canActOnReserved={isHumanTurn && i === state.current}
              selectedReserved={i === state.current ? selectedReserved : null}
              onSelectReserved={reservedClick}
              onBuyReserved={(card) =>
                applyWithFx({ type: 'buy', cardId: card.id, from: 'reserved' })
              }
            />
          ))}
        </div>
      </div>

      {banner && (
        <div className="banner">
          <div className="banner-title gold-text">{banner.title}</div>
          {banner.sub && <div className="banner-sub">{banner.sub}</div>}
        </div>
      )}

      {humanDiscard && (
        <div className="discard-bar">
          <span className="msg">
            Too many tokens — click {overBy} more in your panel to return
          </span>
        </div>
      )}

      {humanNoble && (
        <div className="modal-scrim">
          <div className="modal">
            <h2 className="gold-text">A Noble Awaits</h2>
            <p>Several nobles admire your collection. Choose who visits your court.</p>
            <div className="noble-choices">
              {qualifyingNobles(state, state.current).map((n) => (
                <NobleView
                  key={n.id}
                  noble={n}
                  onClick={() =>
                    setState((prev) => (prev.phase === 'noble' ? applyNobleChoice(prev, n.id) : prev))
                  }
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {state.phase === 'over' && <VictoryOverlay state={state} onExit={onExit} />}
    </div>
  );
}

// ---------------------------------------------------------------------------

function VictoryOverlay({ state, onExit }: { state: GameState; onExit: () => void }) {
  const confetti = useMemo(() => {
    const colors = ['#f6d67c', '#3d6fd8', '#23a55e', '#d8324a', '#f4f6f8', '#c9992e'];
    return Array.from({ length: 90 }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 2.2,
      duration: 2.6 + Math.random() * 2.4,
      size: 6 + Math.random() * 8,
      color: colors[i % colors.length],
      round: Math.random() > 0.5,
    }));
  }, []);

  const ranked = state.players
    .map((p, i) => ({ p, i, pts: score(p) }))
    .sort((a, b) => b.pts - a.pts || a.p.cards.length - b.p.cards.length);

  return (
    <div className="modal-scrim">
      {confetti.map((c, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${c.left}vw`,
            width: c.size,
            height: c.size * (c.round ? 1 : 0.45),
            background: c.color,
            borderRadius: c.round ? '50%' : '2px',
            animationDelay: `${c.delay}s`,
            animationDuration: `${c.duration}s`,
          }}
        />
      ))}
      <div className="modal">
        <div className="rule-ornament">✦ ✦ ✦</div>
        <h2 className="victory-title gold-text">
          {state.winners!.map((i) => state.players[i].name).join(' & ')}{' '}
          {state.winners!.length === 1 && state.players[state.winners![0]].name !== 'You'
            ? 'Triumphs'
            : 'Triumph'}
        </h2>
        <div className="victory-scores">
          {ranked.map(({ p, i, pts }) => (
            <div key={i} className={`victory-row ${state.winners!.includes(i) ? 'winner' : ''}`}>
              <span>
                {state.winners!.includes(i) ? '♛ ' : ''}
                {p.name}
              </span>
              <span>
                {pts} pts · {p.cards.length} cards · {p.nobles.length} nobles
              </span>
            </div>
          ))}
        </div>
        <button className="start-btn" onClick={onExit}>
          Play Again
        </button>
      </div>
    </div>
  );
}
