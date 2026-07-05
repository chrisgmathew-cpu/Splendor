import { Card, GemColor, GEM_COLORS, PlayerState, TokenColor, TOKEN_COLORS } from '../engine/types';
import { bonuses, canAfford, count, score } from '../engine/game';
import { TokenChip } from './Gem';
import { CardView } from './CardView';
import { crownImg } from './assets';

interface PlayerPanelProps {
  player: PlayerState;
  index: number;
  active: boolean;
  isThinking: boolean;
  /** Discard mode: clicking a token discards it. */
  discardMode: boolean;
  onDiscardToken?: (color: TokenColor) => void;
  /** Reserved-card interaction for the human whose turn it is. */
  canActOnReserved: boolean;
  selectedReserved: number | null;
  onSelectReserved?: (card: Card) => void;
  onBuyReserved?: (card: Card) => void;
}

export function PlayerPanel({
  player,
  index,
  active,
  isThinking,
  discardMode,
  onDiscardToken,
  canActOnReserved,
  selectedReserved,
  onSelectReserved,
  onBuyReserved,
}: PlayerPanelProps) {
  const bonus = bonuses(player);
  const pts = score(player);

  return (
    <div className={`player-panel ${active ? 'active' : ''}`} data-fly-target={`player-${index}`}>
      {active && <span className="panel-sweep" />}
      <div className="pp-head">
        <span className="pp-name">{player.name}</span>
        <span className="pp-kind">
          {player.kind === 'ai' ? `AI · ${player.difficulty}` : 'Human'}
        </span>
        {isThinking && (
          <span className="thinking-dots" aria-label="thinking">
            <span />
            <span />
            <span />
          </span>
        )}
        <span className="pp-score gold-text">{pts}</span>
      </div>

      <div className="pp-row pp-bonuses">
        <span className="pp-label">Bonuses</span>
        {GEM_COLORS.map((c: GemColor) => (
          <span
            key={c}
            className={`bonus-chip b-${c} ${(bonus[c] ?? 0) === 0 ? 'empty' : ''}`}
            title={`${bonus[c] ?? 0} ${c} bonus`}
          >
            {bonus[c] ?? 0}
          </span>
        ))}
      </div>

      {/* Compact fit-mode view: bonus count per color with the held-token
          count as a gold badge — one row instead of two. Hidden by default,
          shown via CSS in compact contexts. */}
      <div className="pp-row pp-combined" data-fly-target={`player-${index}-combined`}>
        {GEM_COLORS.map((c: GemColor) => {
          const b = bonus[c] ?? 0;
          const t = count(player.tokens, c);
          const inner = (
            <>
              <span className={`bonus-chip b-${c} ${b === 0 && t === 0 ? 'empty' : ''}`}>{b}</span>
              {t > 0 && <span className="token-count">{t}</span>}
            </>
          );
          return discardMode && t > 0 ? (
            <button key={c} className="combo" onClick={() => onDiscardToken?.(c)}>
              {inner}
            </button>
          ) : (
            <span key={c} className="combo" title={`${b} ${c} bonuses, ${t} tokens`}>
              {inner}
            </span>
          );
        })}
        {count(player.tokens, 'gold') > 0 &&
          (discardMode ? (
            <button className="combo" onClick={() => onDiscardToken?.('gold')}>
              <TokenChip color="gold" small />
              <span className="token-count">{count(player.tokens, 'gold')}</span>
            </button>
          ) : (
            <span className="combo" title={`${count(player.tokens, 'gold')} gold jokers`}>
              <TokenChip color="gold" small />
              <span className="token-count">{count(player.tokens, 'gold')}</span>
            </span>
          ))}
      </div>

      <div className="pp-row pp-tokens" data-fly-target={`player-${index}-tokens`}>
        <span className="pp-label">
          Tokens{discardMode ? ' — click to return' : ''}
        </span>
        {TOKEN_COLORS.filter((c) => count(player.tokens, c) > 0).map((c: TokenColor) =>
          discardMode ? (
            <button key={c} className="pp-token" onClick={() => onDiscardToken?.(c)}>
              <TokenChip color={c} small />
              <span className="token-count">{count(player.tokens, c)}</span>
            </button>
          ) : (
            <span key={c} className="pp-token">
              <TokenChip color={c} small />
              <span className="token-count">{count(player.tokens, c)}</span>
            </span>
          ),
        )}
      </div>

      {(player.reserved.length > 0 || player.nobles.length > 0) && (
        <div className="pp-row">
          {player.reserved.length > 0 && (
            <>
              <span className="pp-label">Reserved</span>
              <div className="pp-reserved">
                {player.reserved.map((card) => (
                  <div key={card.id} className="reserved-wrap">
                    <CardView
                      card={card}
                      mini
                      affordable={canActOnReserved && canAfford(player, card)}
                      selected={selectedReserved === card.id}
                      disabled={!canActOnReserved}
                      onClick={() => onSelectReserved?.(card)}
                    >
                      {selectedReserved === card.id && (
                        <span
                          className="card-actions"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="buy"
                            disabled={!canAfford(player, card)}
                            onClick={() => onBuyReserved?.(card)}
                          >
                            Buy
                          </button>
                        </span>
                      )}
                    </CardView>
                  </div>
                ))}
              </div>
            </>
          )}
          {player.nobles.length > 0 && (
            <div className="pp-nobles">
              {player.nobles.map((n) => (
                <span key={n.id} className="pp-noble-mini" title="Noble (+3)">
                  {crownImg() ? <img src={crownImg()} alt="noble crown" /> : '♛'}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
