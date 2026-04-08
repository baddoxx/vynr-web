/**
 * Atlas hierarchy resolver for web treemap browser.
 *
 * Loads the bundled atlas_v1.json (build-time artifact from vynr-data)
 * and provides O(1) node lookups plus path resolution from any atlas ID
 * up to the root.
 *
 * This is the same dataset that powers the iOS app's atlas hierarchy,
 * synced through the same vynr-data release flow. No runtime fetch —
 * the atlas is imported as a static module.
 *
 * ADR-0072: "bundled atlas refdata may be used locally to resolve
 * canonical hierarchy for rendering when atlas IDs are present"
 */

import atlasData from './atlas_v1.json';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AtlasNode {
  id: string;
  level: string;          // 'root' | 'continent' | 'country' | 'geoUnit'
  displayName: string;
  canonicalKey: string;
  parentId: string | null;
  childIds: string[];
  typicalWineType?: string;
  countryCode?: string;
}

/** A step in the path from a leaf node up to root, excluding root and continents. */
export interface AtlasPathStep {
  id: string;
  displayName: string;
  level: string;
}

// ─── Atlas Index ────────────────────────────────────────────────────────────

const nodeIndex = new Map<string, AtlasNode>();

for (const raw of (atlasData as { nodes: AtlasNode[] }).nodes) {
  nodeIndex.set(raw.id, raw);
}

/**
 * Look up an atlas node by ID. Returns undefined if not found.
 */
export function getAtlasNode(id: string): AtlasNode | undefined {
  return nodeIndex.get(id);
}

/**
 * Resolve the full geographic path from an atlas node up to (but not including)
 * root and continent levels. Returns path from country down to the node itself.
 *
 * Example: "geo:fr:aloxe-corton" →
 *   [ { id: "ctr:fr", displayName: "France", level: "country" },
 *     { id: "geo:fr:burgundy", displayName: "Burgundy", level: "geoUnit" },
 *     { id: "geo:fr:cote-de-beaune", displayName: "Côte de Beaune", level: "geoUnit" },
 *     { id: "geo:fr:aloxe-corton", displayName: "Aloxe-Corton", level: "geoUnit" } ]
 */
export function resolveAtlasPath(nodeId: string): AtlasPathStep[] | null {
  const node = nodeIndex.get(nodeId);
  if (!node) return null;

  // Walk up to root, collecting ancestors
  const chain: AtlasPathStep[] = [];
  let current: AtlasNode | undefined = node;

  while (current && current.level !== 'root' && current.level !== 'continent') {
    chain.push({
      id: current.id,
      displayName: current.displayName,
      level: current.level,
    });
    current = current.parentId ? nodeIndex.get(current.parentId) : undefined;
  }

  // Reverse so it goes from country → ... → leaf
  chain.reverse();
  return chain.length > 0 ? chain : null;
}

/**
 * Resolve a wine entry's deepest atlas ID to a full geographic path.
 * Tries atlasAppellationId first (most specific), then atlasRegionId, then atlasCountryId.
 * Returns null if no atlas ID resolves.
 */
export function resolveWineAtlasPath(entry: {
  atlasAppellationId?: string;
  atlasRegionId?: string;
  atlasCountryId?: string;
}): AtlasPathStep[] | null {
  // Try most specific first
  if (entry.atlasAppellationId) {
    const path = resolveAtlasPath(entry.atlasAppellationId);
    if (path) return path;
  }
  if (entry.atlasRegionId) {
    const path = resolveAtlasPath(entry.atlasRegionId);
    if (path) return path;
  }
  if (entry.atlasCountryId) {
    const path = resolveAtlasPath(entry.atlasCountryId);
    if (path) return path;
  }
  return null;
}
