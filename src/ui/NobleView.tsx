import { GEM_COLORS, Noble } from '../engine/types';
import { Gem } from './Gem';
import { nobleImg } from './assets';

export function NobleView({
  noble,
  dealDelay,
  onClick,
}: {
  noble: Noble;
  dealDelay?: number;
  onClick?: () => void;
}) {
  const art = nobleImg(noble.id);
  return (
    <div
      className={`noble-tile ${art ? 'has-art' : ''}`}
      style={{
        ...(dealDelay ? { animationDelay: `${dealDelay}ms` } : undefined),
        ...(art ? { backgroundImage: `url(${art})` } : undefined),
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      aria-label={`Noble worth ${noble.points} points`}
    >
      <span className="noble-pts">{noble.points}</span>
      {!art && <span className="noble-crown">♛</span>}
      <div className="noble-reqs">
        {GEM_COLORS.filter((c) => (noble.requirement[c] ?? 0) > 0).map((c) => (
          <span key={c} className="noble-req">
            <Gem color={c} size={13} />
            {noble.requirement[c]}
          </span>
        ))}
      </div>
    </div>
  );
}
