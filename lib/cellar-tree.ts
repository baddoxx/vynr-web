/**
 * Cellar hierarchy builder for web treemap browser.
 * Pure TypeScript. No React. No layout concerns. No async.
 * Builds a navigable tree from flat ShareEntry[] pack data.
 */
import type { ShareEntry } from './share-api';
import { dominantWineType } from './treemap-colors';
import { resolveWineAtlasPath, type AtlasPathStep } from './atlas';

/** Wine-type composition breakdown for a group node. Sorted by fraction descending. */
export interface WineTypeSegment {
  type: string;   // lowercase wine type key
  count: number;
  fraction: number; // 0..1
}

export interface CellarNode {
  id: string;
  label: string;
  kind: 'country' | 'region' | 'appellation' | 'wine';
  wineType?: string;
  weight: number;
  children: CellarNode[];
  entry?: ShareEntry;
  /** Wine-type composition for group nodes. Empty for wine leaves. */
  composition: WineTypeSegment[];
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

// ─── buildHierarchy internals ─────────────────────────────────────────────────

/** Internal mutable node used during tree construction. */
interface MutableNode {
  id: string;
  label: string;
  kind: 'country' | 'region' | 'appellation';
  /** Children that are geography group nodes (not wine leaves). */
  children: Map<string, MutableNode>;
  /** Wine entries that live directly under this node. */
  wines: ShareEntry[];
}

function makeMutableNode(
  id: string,
  label: string,
  kind: 'country' | 'region' | 'appellation'
): MutableNode {
  return { id, label, kind, children: new Map(), wines: [] };
}

function getOrCreateChild(
  parent: MutableNode,
  id: string,
  label: string,
  kind: 'country' | 'region' | 'appellation'
): MutableNode {
  const existing = parent.children.get(id);
  if (existing) return existing;
  const node = makeMutableNode(id, label, kind);
  parent.children.set(id, node);
  return node;
}

/** Recursively collect all wine types under a mutable node (for wineType computation). */
function collectWineTypes(node: MutableNode): string[] {
  const types: string[] = node.wines.map((e) => e.wineType);
  for (const child of node.children.values()) {
    types.push(...collectWineTypes(child));
  }
  return types;
}

/** Compute wine-type composition segments from a list of wine types. Sorted by fraction desc. */
function computeComposition(wineTypes: string[]): WineTypeSegment[] {
  if (wineTypes.length === 0) return [];
  const counts = new Map<string, number>();
  for (const t of wineTypes) {
    const key = t.toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const total = wineTypes.length;
  const segments: WineTypeSegment[] = [];
  for (const [type, count] of counts) {
    segments.push({ type, count, fraction: count / total });
  }
  segments.sort((a, b) => b.fraction - a.fraction || a.type.localeCompare(b.type));
  return segments;
}

/** Recursively collect wine types from a finalized CellarNode (used after finalization). */
function collectWineTypesFromNode(node: CellarNode): string[] {
  if (node.kind === 'wine') return node.wineType ? [node.wineType] : [];
  const types: string[] = [];
  for (const child of node.children) {
    types.push(...collectWineTypesFromNode(child));
  }
  return types;
}

/**
 * Convert a MutableNode to a sorted array of CellarNode children.
 * Wine leaves are appended after geography children, then the whole
 * list is sorted by weight desc, label alpha asc.
 */
function finalize(node: MutableNode, parentPath: string): CellarNode {
  // Finalize geography children recursively
  const geoChildren: CellarNode[] = [];
  for (const child of node.children.values()) {
    geoChildren.push(finalize(child, `${parentPath}/${normalizeKey(child.label)}`));
  }

  // Create wine leaves
  const wineLeaves: CellarNode[] = node.wines.map((entry) => {
    const wineId = `wine:${parentPath}/${entry.externalEntryId}`;
    return {
      id: wineId,
      label: entry.wineName,
      kind: 'wine',
      wineType: entry.wineType,
      weight: 1,
      children: [],
      entry,
      composition: [],
    };
  });

  const allChildren: CellarNode[] = [...geoChildren, ...wineLeaves];

  // Sort: weight desc, then label alpha asc (locale-stable, normalised)
  allChildren.sort((a, b) => {
    if (b.weight !== a.weight) return b.weight - a.weight;
    return normalizeKey(a.label).localeCompare(normalizeKey(b.label));
  });

  const weight = allChildren.reduce((sum, c) => sum + c.weight, 0);
  const wineTypes = collectWineTypes(node);
  const wineType = dominantWineType(wineTypes);
  const composition = computeComposition(wineTypes);

  return {
    id: node.id,
    label: node.label,
    kind: node.kind,
    wineType,
    weight,
    children: allChildren,
    composition,
  };
}

/**
 * Insert a wine entry into the mutable tree using its atlas path.
 * Creates all intermediate nodes (sub-regions, etc.) from the atlas.
 */
function insertViaAtlasPath(root: MutableNode, entry: ShareEntry, atlasPath: AtlasPathStep[]): void {
  let parent = root;

  for (const step of atlasPath) {
    // Determine kind from atlas level
    const kind: CellarNode['kind'] = step.level === 'country' ? 'country' : 'region';
    const node = getOrCreateChild(parent, step.id, step.displayName, kind);
    parent = node;
  }

  // Attach wine to the deepest atlas node
  parent.wines.push(entry);
}

/**
 * Insert a wine entry using flat pack geography strings (fallback when no atlas IDs).
 */
function insertViaFlatGeography(root: MutableNode, entry: ShareEntry): void {
  const countryLabel = entry.country.trim();
  const regionLabel = entry.region?.trim();
  const appellationLabel = entry.appellation?.trim();

  const countryKey = normalizeKey(countryLabel);
  const countryId = `country:${countryKey}`;
  const countryNode = getOrCreateChild(root, countryId, countryLabel, 'country');

  if (!regionLabel) {
    countryNode.wines.push(entry);
    return;
  }

  const regionKey = normalizeKey(regionLabel);
  const regionId = `region:${countryKey}/${regionKey}`;
  const regionNode = getOrCreateChild(countryNode, regionId, regionLabel, 'region');

  if (!appellationLabel) {
    regionNode.wines.push(entry);
    return;
  }

  const appellationKey = normalizeKey(appellationLabel);
  const appellationId = `appellation:${countryKey}/${regionKey}/${appellationKey}`;
  const appellationNode = getOrCreateChild(regionNode, appellationId, appellationLabel, 'appellation');
  appellationNode.wines.push(entry);
}

/**
 * Build a navigable geography hierarchy from flat ShareEntry[] pack data.
 *
 * Two paths:
 * - **Atlas-backed** (preferred): When pack entries carry atlas IDs, resolves
 *   the full geographic chain from the bundled atlas_v1.json. This produces
 *   the same hierarchy depth as the iOS app (e.g., Burgundy → Côte de Beaune → Aloxe-Corton).
 * - **Flat fallback**: When atlas IDs are absent, uses the pack's country/region/appellation
 *   strings to build a simpler 3-level hierarchy.
 *
 * ADR-0072: hierarchy alignment is a product requirement. Same cellar
 * must browse the same way on iOS and web.
 */
export function buildHierarchy(entries: ShareEntry[]): CellarNode[] {
  const root: MutableNode = makeMutableNode('__root__', '__root__', 'country');

  for (const entry of entries) {
    // Try atlas-backed path first
    const atlasPath = resolveWineAtlasPath(entry);
    if (atlasPath && atlasPath.length > 0) {
      insertViaAtlasPath(root, entry, atlasPath);
    } else {
      // Fallback to flat geography strings
      insertViaFlatGeography(root, entry);
    }
  }

  // Finalize root children (countries)
  const roots: CellarNode[] = [];
  for (const countryMutable of root.children.values()) {
    const idSuffix = countryMutable.id.includes(':')
      ? countryMutable.id.split(':').slice(1).join(':')
      : normalizeKey(countryMutable.label);
    roots.push(finalize(countryMutable, idSuffix));
  }

  // Sort roots
  roots.sort((a, b) => {
    if (b.weight !== a.weight) return b.weight - a.weight;
    return normalizeKey(a.label).localeCompare(normalizeKey(b.label));
  });

  return roots;
}

// ─── Traversal and query functions ───────────────────────────────────────────

/**
 * Walk the tree by pathIds, returning the children visible at that scope
 * and the resolved path (which may be shorter than the input if stale).
 *
 * Falls back to the closest valid ancestor if any path segment is stale.
 * Returns roots + empty resolvedPath when the entire path is invalid.
 */
export function resolveScope(
  roots: CellarNode[],
  pathIds: string[]
): { children: CellarNode[]; resolvedPath: string[] } {
  if (pathIds.length === 0) return { children: roots, resolvedPath: [] };

  let current: CellarNode[] = roots;
  const resolvedPath: string[] = [];

  for (const id of pathIds) {
    const match = current.find((n) => n.id === id);
    if (!match) break;
    resolvedPath.push(id);
    current = match.children;
  }

  if (resolvedPath.length === 0) {
    return { children: roots, resolvedPath: [] };
  }

  return { children: current, resolvedPath };
}

/**
 * Returns the node at the end of pathIds, null at root.
 * If the path is stale, returns the last valid node rather than null.
 */
export function resolveCurrentNode(
  roots: CellarNode[],
  pathIds: string[]
): CellarNode | null {
  if (pathIds.length === 0) return null;

  let current: CellarNode[] = roots;
  let lastValid: CellarNode | null = null;

  for (const id of pathIds) {
    const match = current.find((n) => n.id === id);
    if (!match) break;
    lastValid = match;
    current = match.children;
  }

  return lastValid;
}

/**
 * Returns breadcrumb segments `{ id, label }[]` for the given path.
 * Each segment corresponds to one node in the resolved path.
 */
export function breadcrumbSegments(
  roots: CellarNode[],
  pathIds: string[]
): { id: string; label: string }[] {
  if (pathIds.length === 0) return [];

  const segments: { id: string; label: string }[] = [];
  let current: CellarNode[] = roots;

  for (const id of pathIds) {
    const match = current.find((n) => n.id === id);
    if (!match) break;
    segments.push({ id: match.id, label: match.label });
    current = match.children;
  }

  return segments;
}

/**
 * Returns true if all of node's children are wine leaves (and there is at least one child).
 * Identifies the deepest drillable geography level.
 */
export function isLeafLevel(node: CellarNode): boolean {
  return node.children.length > 0 && node.children.every((c) => c.kind === 'wine');
}

/** Returns true if the node is a wine leaf. */
export function isWineNode(node: CellarNode): boolean {
  return node.kind === 'wine';
}

/**
 * Returns true if the node can be drilled into.
 * A node can be drilled if it has children and is not itself a wine.
 */
export function canDrill(node: CellarNode): boolean {
  return node.children.length > 0 && node.kind !== 'wine';
}

/**
 * Recursively collect all ShareEntry objects from a node and its descendants.
 * Wine nodes contribute their own entry. Group nodes contribute descendants' entries.
 */
export function flattenWines(node: CellarNode): ShareEntry[] {
  if (node.kind === 'wine' && node.entry) return [node.entry];
  const results: ShareEntry[] = [];
  for (const child of node.children) {
    results.push(...flattenWines(child));
  }
  return results;
}

/**
 * Build a flat Map<string, CellarNode> by walking the full tree.
 * Indexes every node (geography and wine) by its ID.
 */
export function buildNodeIndex(roots: CellarNode[]): Map<string, CellarNode> {
  const index = new Map<string, CellarNode>();

  function walk(node: CellarNode): void {
    index.set(node.id, node);
    for (const child of node.children) {
      walk(child);
    }
  }

  for (const root of roots) {
    walk(root);
  }

  return index;
}

/**
 * Build a flat Map<string, ShareEntry> indexing wine entries by their wine node ID.
 * Only wine-kind nodes are included.
 */
export function buildWineIndex(roots: CellarNode[]): Map<string, ShareEntry> {
  const index = new Map<string, ShareEntry>();

  function walk(node: CellarNode): void {
    if (node.kind === 'wine' && node.entry) {
      index.set(node.id, node.entry);
    }
    for (const child of node.children) {
      walk(child);
    }
  }

  for (const root of roots) {
    walk(root);
  }

  return index;
}
