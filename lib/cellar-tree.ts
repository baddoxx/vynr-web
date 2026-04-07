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

  return {
    id: node.id,
    label: node.label,
    kind: node.kind,
    wineType,
    weight,
    children: allChildren,
  };
}

/**
 * Build a navigable geography hierarchy from flat ShareEntry[] pack data.
 *
 * Hierarchy: country → region → appellation → wine
 * Missing intermediate levels are collapsed: if a wine has no region,
 * it nests directly under its country node; if it has a region but no
 * appellation, it nests directly under its region node.
 *
 * Node IDs:
 *   country:   `country:{normalizedCountry}`
 *   region:    `region:{normalizedCountry}/{normalizedRegion}`
 *   appellation: `appellation:{normalizedCountry}/{normalizedRegion}/{normalizedAppellation}`
 *   wine:      `wine:{parentPath}/{externalEntryId}`
 *
 * Returned roots are sorted by weight desc, then label alpha asc.
 */
export function buildHierarchy(entries: ShareEntry[]): CellarNode[] {
  // Root-level virtual container — its children are the top-level countries
  const root: MutableNode = makeMutableNode('__root__', '__root__', 'country');

  for (const entry of entries) {
    const countryLabel = entry.country.trim();
    const regionLabel = entry.region?.trim();
    const appellationLabel = entry.appellation?.trim();

    const countryKey = normalizeKey(countryLabel);
    const countryId = `country:${countryKey}`;

    const countryNode = getOrCreateChild(root, countryId, countryLabel, 'country');

    if (!regionLabel) {
      // No region — wine nests directly under country
      countryNode.wines.push(entry);
      continue;
    }

    const regionKey = normalizeKey(regionLabel);
    const regionId = `region:${countryKey}/${regionKey}`;
    const regionNode = getOrCreateChild(countryNode, regionId, regionLabel, 'region');

    if (!appellationLabel) {
      // No appellation — wine nests directly under region
      regionNode.wines.push(entry);
      continue;
    }

    const appellationKey = normalizeKey(appellationLabel);
    const appellationId = `appellation:${countryKey}/${regionKey}/${appellationKey}`;
    const appellationNode = getOrCreateChild(regionNode, appellationId, appellationLabel, 'appellation');

    appellationNode.wines.push(entry);
  }

  // Finalize root children (countries)
  const roots: CellarNode[] = [];
  for (const countryMutable of root.children.values()) {
    const countryKey = normalizeKey(countryMutable.label);
    roots.push(finalize(countryMutable, countryKey));
  }

  // Sort roots
  roots.sort((a, b) => {
    if (b.weight !== a.weight) return b.weight - a.weight;
    return normalizeKey(a.label).localeCompare(normalizeKey(b.label));
  });

  return roots;
}
