import { Card, GemColor, GEM_COLORS } from '../engine/types';
import { Gem } from './Gem';

interface CardViewProps {
  card: Card;
  mini?: boolean;
  affordable?: boolean;
  selected?: boolean;
  disabled?: boolean;
  dealDelay?: number;
  flyTarget?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

export function CardView({
  card,
  mini,
  affordable,
  selected,
  disabled,
  dealDelay,
  flyTarget,
  onClick,
  children,
}: CardViewProps) {
  const classes = [
    'dev-card',
    `c-${card.bonus}`,
    mini ? 'mini' : '',
    affordable ? 'affordable' : '',
    selected ? 'selected' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const costEntries = GEM_COLORS.filter((c) => (card.cost[c] ?? 0) > 0);

  return (
    <button
      className={classes}
      disabled={disabled}
      onClick={onClick}
      style={dealDelay ? { animationDelay: `${dealDelay}ms` } : undefined}
      data-card-id={card.id}
      data-fly-target={flyTarget}
      aria-label={`Tier ${card.tier} ${card.bonus} card, ${card.points} points`}
    >
      <div className="card-head">
        <span className="card-pts">{card.points > 0 ? card.points : ''}</span>
        <Gem color={card.bonus} size={mini ? 18 : 30} />
      </div>
      <div className="card-costs">
        {costEntries.map((c: GemColor) => (
          <span key={c} className={`cost-bubble b-${c}`}>
            {card.cost[c]}
          </span>
        ))}
      </div>
      <span className="card-sheen" />
      {children}
    </button>
  );
}
