/**
 * Cellar hierarchy builder for web treemap browser.
 * Pure TypeScript. No React. No layout concerns. No async.
 * Builds a navigable tree from flat ShareEntry[] pack data.
 */
import type { ShareEntry } from './share-api';
import { dominantWineType } from './treemap-colors';

export interface CellarNode {
  id: string;
  label: string;
  kind: 'country' | 'region' | 'appellation' | 'wine';
  wineType?: string;
  weight: number;
  children: CellarNode[];
  entry?: ShareEntry;
}

/**
 * Normalize a geography string for use in node IDs.
 * Lowercase, trimmed, internal whitespace collapsed.
 * Normalization is intentionally NOT ASCII-slugification.
 * Diacritics are preserved. Do not strip accents.
 */
export function normalizeKey(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ');
}
