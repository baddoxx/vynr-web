/**
 * Tile label rendering utilities for dense treemaps.
 * Ported from vynrCore/Services/TileLabelRenderer.swift.
 *
 * Three tiers:
 * 1. Full label (tile min dimension >= 60px)
 * 2. Compact abbreviation (>= 40px) — not implemented yet, use full label
 * 3. Monogram (< 40px) — 2-4 character uppercase abbreviation
 */

const STOPWORDS = new Set([
  'de', 'du', 'des', 'la', 'le', 'les', 'd', 'l',
  'di', 'del', 'della', 'dei', 'degli',
  'das', 'der', 'die',
  'el', 'los', 'las',
]);

/**
 * Fold diacritics: E→E, o→o, etc.
 */
function foldDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Generate a 2-4 character monogram from a place name.
 * "Montagne-Saint-Emilion" → "MSE", "Cotes de Bourg" → "CB"
 */
export function generateMonogram(name: string): string {
  if (!name) return '??';

  const folded = foldDiacritics(name);
  const normalized = folded.replace(/['']/g, ' ');
  const tokens = normalized.split(/[\s-]+/).map(t => t.trim()).filter(Boolean);
  const significant = tokens.filter(t => !STOPWORDS.has(t.toLowerCase()));
  const toUse = significant.length > 0 ? significant : tokens;

  const initials: string[] = [];
  for (const token of toUse.slice(0, 4)) {
    const first = token[0];
    if (first && /[a-zA-Z]/.test(first)) {
      initials.push(first.toUpperCase());
    }
  }

  if (initials.length >= 2) return initials.join('');
  // Fallback: first 2 chars of the name
  return foldDiacritics(name).slice(0, 2).toUpperCase();
}

export type LabelMode = 'full' | 'vertical' | 'monogram' | 'hidden';

/**
 * Classify how a tile label should render based on dimensions.
 */
export function classifyLabel(
  width: number,
  height: number,
  labelLength: number,
): LabelMode {
  const minDim = Math.min(width, height);

  // Too small for anything
  if (minDim < 18) return 'hidden';

  // Wide enough for horizontal text
  if (width >= 60) return 'full';

  // Tall and narrow — try vertical
  if (width >= 26 && height >= 44 && height > width * 1.5) {
    const estimatedTextWidth = labelLength * 5.5; // rough char width at small font
    if (estimatedTextWidth <= height * 0.9) return 'vertical';
  }

  // Monogram fallback
  return 'monogram';
}
