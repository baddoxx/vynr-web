/**
 * Wine type color mapping for treemap tiles.
 *
 * Colors sourced from WineSemanticPalette.swift (iOS app canonical palette).
 * The four chromatic colors (red, white, rose, orange) use the Swift `whisper`
 * channel values. Structure types (sparkling, fortified, dessert) use the
 * existing web palette values from page.tsx.
 */

// ─── Palette ─────────────────────────────────────────────────────────────────

interface WineColorEntry {
  /** Whisper/tint color — used for tile fills at low opacity */
  whisper: { r: number; g: number; b: number };
  /** Full-strength color — used for labels and borders */
  label: string;
}

const PALETTE: Record<string, WineColorEntry> = {
  // Chromatic colors from WineSemanticPalette.swift whisper channel
  red: {
    whisper: { r: 0xb8, g: 0x45, b: 0x45 }, // #B84545
    label: '#9B4A4A',
  },
  white: {
    whisper: { r: 0xe0, g: 0xb8, b: 0x78 }, // #E0B878
    label: '#7A6820',
  },
  rose: {
    whisper: { r: 0xd4, g: 0x98, b: 0x98 }, // #D49898
    label: '#A84858',
  },
  rosé: {
    whisper: { r: 0xd4, g: 0x98, b: 0x98 }, // #D49898
    label: '#A84858',
  },
  orange: {
    whisper: { r: 0xd4, g: 0x8a, b: 0x50 }, // #D48A50
    label: '#B46830',
  },
  // Structure types — from existing web palette
  sparkling: {
    whisper: { r: 90, g: 120, b: 160 },
    label: '#3A5888',
  },
  dessert: {
    whisper: { r: 160, g: 110, b: 30 },
    label: '#7A5010',
  },
  fortified: {
    whisper: { r: 100, g: 60, b: 30 },
    label: '#643C1E',
  },
};

const FALLBACK: WineColorEntry = {
  whisper: { r: 0x8a, g: 0x7d, b: 0x68 },
  label: '#6B614E',
};

function resolve(wineType: string): WineColorEntry {
  return PALETTE[wineType.toLowerCase()] ?? FALLBACK;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Returns the full-strength hex color for a wine type.
 * Used for tile labels and borders.
 */
export function wineTypeColor(wineType: string): string {
  return resolve(wineType).label;
}

/**
 * Returns an rgba() string for the whisper tint of a wine type.
 * Default opacity 0.10 (10%) — matches the iOS MutedTheme tile overlay.
 */
export function wineTypeTint(wineType: string, opacity: number = 0.10): string {
  const { r, g, b } = resolve(wineType).whisper;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Returns a slightly stronger tint for hover states.
 */
export function wineTypeHoverTint(wineType: string): string {
  return wineTypeTint(wineType, 0.20);
}

/**
 * Returns a border color — tint at ~25% opacity.
 */
export function wineTypeBorder(wineType: string): string {
  return wineTypeTint(wineType, 0.25);
}

/**
 * Determine the dominant wine type from a list of wine type strings.
 * Returns the most frequent type when one clearly dominates.
 * Returns undefined when the distribution is tied or empty.
 * Deterministic for a given input.
 */
export function dominantWineType(wineTypes: string[]): string | undefined {
  if (wineTypes.length === 0) return undefined;

  const counts = new Map<string, number>();
  for (const t of wineTypes) {
    const key = t.toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  let best = '';
  let bestCount = 0;
  let tied = false;
  for (const [key, count] of counts) {
    if (count > bestCount) {
      best = key;
      bestCount = count;
      tied = false;
    } else if (count === bestCount) {
      tied = true;
    }
  }

  return tied ? undefined : best || undefined;
}
