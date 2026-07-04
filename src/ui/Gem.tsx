import { TokenColor } from '../engine/types';

/** Palette per gem: [deep, mid, light, sparkle] */
export const GEM_PALETTE: Record<TokenColor, [string, string, string, string]> = {
  white: ['#9aa5b1', '#dfe7ef', '#ffffff', '#ffffff'],
  blue: ['#0f2f7f', '#2458c5', '#6fa3f2', '#dbeaff'],
  green: ['#0b5e35', '#149d58', '#4fd88f', '#d2ffe8'],
  red: ['#7a0c1e', '#c01730', '#ee4b63', '#ffd9de'],
  black: ['#0b0b10', '#26262f', '#4d4d5c', '#a8a8bd'],
  gold: ['#8a5a00', '#d99b1c', '#f7ce53', '#fff3c4'],
};

/** Display names used in tooltips and labels. */
export const GEM_LABEL: Record<TokenColor, string> = {
  white: 'Diamond',
  blue: 'Sapphire',
  green: 'Emerald',
  red: 'Ruby',
  black: 'Onyx',
  gold: 'Gold',
};

interface GemProps {
  color: TokenColor;
  size?: number;
}

/**
 * A faceted jewel drawn in SVG. Each color uses the same cut with its own
 * palette; gold renders as a coin-like nugget to read as the joker.
 */
export function Gem({ color, size = 26 }: GemProps) {
  const [deep, mid, light, sparkle] = GEM_PALETTE[color];
  const uid = `gem-${color}`;

  if (color === 'gold') {
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" aria-label="gold joker">
        <defs>
          <radialGradient id={`${uid}-g`} cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor={sparkle} />
            <stop offset="45%" stopColor={light} />
            <stop offset="100%" stopColor={deep} />
          </radialGradient>
        </defs>
        <circle cx="20" cy="20" r="17" fill={`url(#${uid}-g)`} stroke={deep} strokeWidth="1.6" />
        <circle cx="20" cy="20" r="12.5" fill="none" stroke={deep} strokeWidth="1" opacity="0.5" />
        <path
          d="M20 11 l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.2 6.1-.7z"
          fill={mid}
          stroke={deep}
          strokeWidth="0.8"
        />
        <ellipse cx="14" cy="12" rx="4.5" ry="2.6" fill="#fff" opacity="0.55" transform="rotate(-25 14 12)" />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-label={GEM_LABEL[color]}>
      <defs>
        <linearGradient id={`${uid}-t`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={light} />
          <stop offset="100%" stopColor={mid} />
        </linearGradient>
        <linearGradient id={`${uid}-b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={mid} />
          <stop offset="100%" stopColor={deep} />
        </linearGradient>
      </defs>
      {/* crown */}
      <polygon points="12,8 28,8 34,17 6,17" fill={`url(#${uid}-t)`} stroke={deep} strokeWidth="1" strokeLinejoin="round" />
      {/* pavilion */}
      <polygon points="6,17 34,17 20,35" fill={`url(#${uid}-b)`} stroke={deep} strokeWidth="1" strokeLinejoin="round" />
      {/* facets */}
      <polygon points="12,8 20,17 6,17" fill={mid} opacity="0.75" />
      <polygon points="28,8 34,17 20,17" fill={light} opacity="0.55" />
      <polygon points="12,8 28,8 20,17" fill={light} opacity="0.85" />
      <polygon points="13,17 27,17 20,29" fill={mid} opacity="0.5" />
      {/* sparkle */}
      <path d="M15 11 l1 2 2 1 -2 1 -1 2 -1-2 -2-1 2-1z" fill={sparkle} opacity="0.95" />
      <circle cx="24" cy="21" r="1.1" fill={sparkle} opacity="0.8" />
    </svg>
  );
}
