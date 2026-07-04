import { useState } from 'react';
import { AiDifficulty, PlayerConfig, TOKEN_COLORS } from '../engine/types';
import { TokenChip } from './Gem';
import { emblemImg, flourishImg } from './assets';

type SeatKind = 'human' | 'ai' | 'off';

interface Seat {
  kind: SeatKind;
  name: string;
  difficulty: AiDifficulty;
}

const DEFAULT_SEATS: Seat[] = [
  { kind: 'human', name: 'You', difficulty: 'medium' },
  { kind: 'ai', name: 'Duke Renard', difficulty: 'medium' },
  { kind: 'off', name: 'Lady Vivienne', difficulty: 'medium' },
  { kind: 'off', name: 'Master Cosimo', difficulty: 'hard' },
];

const DIFFICULTIES: AiDifficulty[] = ['easy', 'medium', 'hard'];

export function MenuScreen({ onStart }: { onStart: (players: PlayerConfig[]) => void }) {
  const [seats, setSeats] = useState<Seat[]>(DEFAULT_SEATS);

  const activeSeats = seats.filter((s) => s.kind !== 'off');
  const canStart = activeSeats.length >= 2;

  const update = (i: number, patch: Partial<Seat>) =>
    setSeats((prev) => prev.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  const start = () => {
    if (!canStart) return;
    onStart(
      activeSeats.map((s) => ({
        name: s.name.trim() || 'Player',
        kind: s.kind as 'human' | 'ai',
        difficulty: s.kind === 'ai' ? s.difficulty : undefined,
      })),
    );
  };

  return (
    <div className="menu-screen">
      <div className="menu-logo">
        {emblemImg() && <img className="menu-emblem" src={emblemImg()} alt="" />}
        <div className="menu-gems">
          {TOKEN_COLORS.filter((c) => c !== 'gold').map((c) => (
            <TokenChip key={c} color={c} size={54} />
          ))}
        </div>
        <h1 className="gold-text">Splendor</h1>
        <div className="tagline">Gems · Merchants · Nobility</div>
        {flourishImg() && <img className="menu-flourish" src={flourishImg()} alt="" />}
      </div>

      <div className="setup-panel">
        <div className="rule-ornament">✦ Assemble the table ✦</div>

        {seats.map((seat, i) => (
          <div key={i} className={`seat-row ${seat.kind === 'off' ? 'off' : ''}`}>
            <span className="seat-num">{i + 1}</span>
            <div className="pill-group">
              {(['human', 'ai', ...(i >= 2 ? ['off' as const] : [])] as SeatKind[]).map((k) => (
                <button
                  key={k}
                  className={`pill ${seat.kind === k ? 'active' : ''}`}
                  onClick={() => update(i, { kind: k })}
                >
                  {k === 'human' ? 'Human' : k === 'ai' ? 'Computer' : 'Empty'}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={seat.name}
              maxLength={16}
              disabled={seat.kind === 'off'}
              onChange={(e) => update(i, { name: e.target.value })}
              aria-label={`Seat ${i + 1} name`}
            />
            {seat.kind === 'ai' && (
              <div className="pill-group">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    className={`pill ${seat.difficulty === d ? 'active' : ''}`}
                    onClick={() => update(i, { difficulty: d })}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        <button className="start-btn" disabled={!canStart} onClick={start}>
          Begin the Game
        </button>
        <div className="menu-note">
          First to 15 prestige points wins. Collect gems, build your engine, charm the nobles.
        </div>
      </div>
    </div>
  );
}
