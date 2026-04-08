/**
 * Grape name → wine color lookup for pill coloring.
 * Uses the same reference data as the iOS app (grapes_v1_core/extended).
 * Matches LimestoneCanvas.GrapePillTint in iOS.
 */

import coreGrapes from './grapes_v1_core.json';
import extGrapes from './grapes_v1_extended.json';

interface GrapeEntry {
  canonical_name: string;
  color?: string;
  aliases?: string[];
}

// Build case-insensitive lookup map
const colorMap = new Map<string, string>();

function indexGrapes(grapes: GrapeEntry[]) {
  for (const g of grapes) {
    const color = g.color;
    if (!color) continue;
    colorMap.set(g.canonical_name.toLowerCase(), color);
    if (g.aliases) {
      for (const alias of g.aliases) {
        if (alias && alias.length > 2) {
          colorMap.set(alias.toLowerCase(), color);
        }
      }
    }
  }
}

indexGrapes((coreGrapes as { grapes: GrapeEntry[] }).grapes);
indexGrapes((extGrapes as { grapes: GrapeEntry[] }).grapes);

/**
 * Look up the color of a grape by name. Returns "red", "white", or undefined.
 * Case-insensitive, matches canonical names and aliases.
 */
export function grapeColor(name: string): string | undefined {
  return colorMap.get(name.toLowerCase());
}

// Grape pill tint tokens — matching iOS LimestoneCanvas.GrapePillTint
export interface GrapePillTint {
  fill: string;
  border: string;
  text: string;
}

const RED_TINT: GrapePillTint = {
  fill: 'rgba(89, 20, 31, 0.15)',
  border: 'rgba(89, 20, 31, 0.35)',
  text: '#4D100A',
};

const WHITE_TINT: GrapePillTint = {
  fill: 'rgba(140, 115, 38, 0.15)',
  border: 'rgba(140, 115, 38, 0.35)',
  text: '#66520D',
};

const NEUTRAL_TINT: GrapePillTint = {
  fill: 'rgba(200, 180, 140, 0.25)',
  border: 'rgba(180, 160, 120, 0.35)',
  text: '#3D3528',
};

export function grapePillTint(grapeName: string): GrapePillTint {
  const color = grapeColor(grapeName);
  if (color === 'red') return RED_TINT;
  if (color === 'white') return WHITE_TINT;
  return NEUTRAL_TINT;
}
