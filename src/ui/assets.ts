import { GemColor, TokenColor } from '../engine/types';

/**
 * AI-painted artwork, downscaled to WebP under src/assets/ and inlined into
 * the bundle at build time (assetsInlineLimit is set high so the production
 * build stays a single self-contained HTML file).
 */
const files = import.meta.glob('../assets/**/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

function asset(rel: string): string {
  return files[`../assets/${rel}`] ?? '';
}

export const tokenImg = (c: TokenColor) => asset(`tokens/token-${c}.webp`);
export const gemImg = (c: TokenColor) => asset(`gems/gem-${c}.webp`);
export const cardImg = (tier: 1 | 2 | 3, bonus: GemColor) =>
  asset(`cards/card-t${tier}-${bonus}.webp`);
export const cardBackImg = (tier: 1 | 2 | 3) => asset(`cards/card-back-t${tier}.webp`);
/** Noble ids are 100..109 → noble-01.webp..noble-10.webp */
export const nobleImg = (id: number) =>
  asset(`nobles/noble-${String(id - 99).padStart(2, '0')}.webp`);
export const tableBg = () => asset('ui/table-bg.webp');
export const emblemImg = () => asset('ui/emblem.webp');
export const flourishImg = () => asset('ui/flourish.webp');
export const crownImg = () => asset('ui/crown.webp');
