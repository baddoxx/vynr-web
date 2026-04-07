# Navigable Web Treemap Browser — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the static share preview at `vynr.app/s/{shareId}` into a navigable drill-down treemap browser with country->region->appellation->wine hierarchy, breadcrumb navigation, treemap/list toggle, and read-only wine detail panel.

**Architecture:** Pure domain layer (`lib/cellar-tree.ts`) builds a deterministic hierarchy from pack entries. Stateful `CellarBrowser` client component owns navigation state (`pathIds`, `viewMode`, `selectedWineId`). Thin presentational components (`TreemapView`, `ListView`, `Breadcrumb`, `ViewToggle`, `WineDetailPanel`) receive derived data and emit events. The tree is built once server-side and passed as an immutable prop.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, SVG treemap rendering, `node:test` for unit tests. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-04-08-navigable-web-treemap-design.md`

**Test runner:** `npx tsx --test lib/__tests__/<file>.test.ts`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `lib/cellar-tree.ts` | Create | Hierarchy building, traversal, indexes, pure functions |
| `lib/__tests__/cellar-tree.test.ts` | Create | Unit tests for all domain logic |
| `lib/treemap-colors.ts` | Modify | Update `dominantWineType()` for undefined-on-tie behavior |
| `app/components/WineCard.tsx` | Create | Shared presentational wine card (extracted from page.tsx) |
| `app/s/[shareId]/CellarBrowser.tsx` | Create | Stateful client shell — owns navigation state |
| `app/s/[shareId]/TreemapView.tsx` | Create | SVG treemap rendering with hover/click/keyboard |
| `app/s/[shareId]/ListView.tsx` | Create | List view with group rows and wine cards |
| `app/s/[shareId]/Breadcrumb.tsx` | Create | Breadcrumb navigation bar |
| `app/s/[shareId]/ViewToggle.tsx` | Create | Treemap/list toggle control |
| `app/s/[shareId]/WineDetailPanel.tsx` | Create | Read-only wine detail slide-over/sheet |
| `app/s/[shareId]/page.tsx` | Modify | Build tree server-side, render CellarBrowser |
| `app/s/[shareId]/Treemap.tsx` | Delete | Replaced by TreemapView.tsx (after verification) |

---

### Task 1: Update `dominantWineType` for tie handling

**Files:**
- Modify: `lib/treemap-colors.ts:102-121`
- Test: `lib/__tests__/treemap-layout.test.ts` (add cases at end)

- [ ] **Step 1: Write failing tests for tie behavior**

Add to `lib/__tests__/treemap-layout.test.ts`:

```typescript
// Add this import at the top of the file (describe/it/assert already imported)
import { dominantWineType } from '../treemap-colors';

// Add this describe block after the existing squarify tests
describe('dominantWineType', () => {
  it('returns the most frequent type', () => {
    assert.equal(dominantWineType(['red', 'red', 'white']), 'red');
  });

  it('returns undefined for even split across 3+ types', () => {
    const result = dominantWineType(['red', 'white', 'rosé']);
    assert.equal(result, undefined);
  });

  it('returns undefined for even split across 2 types', () => {
    const result = dominantWineType(['red', 'white']);
    assert.equal(result, undefined);
  });

  it('returns the type when one clearly dominates', () => {
    assert.equal(dominantWineType(['red', 'red', 'red', 'white']), 'red');
  });

  it('returns undefined for empty array', () => {
    assert.equal(dominantWineType([]), undefined);
  });

  it('is case-insensitive', () => {
    assert.equal(dominantWineType(['Red', 'RED', 'red']), 'red');
  });

  it('returns the type for single-element array', () => {
    assert.equal(dominantWineType(['white']), 'white');
  });

  it('is deterministic for same input', () => {
    const input = ['red', 'white', 'rosé', 'red', 'white', 'rosé'];
    const a = dominantWineType(input);
    const b = dominantWineType(input);
    assert.equal(a, b);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/badday/dev/ios/vynr-app/vynr-web && npx tsx --test lib/__tests__/treemap-layout.test.ts`

Expected: FAIL — `dominantWineType` currently returns `'unknown'` for empty and a string for ties, not `undefined`.

- [ ] **Step 3: Update `dominantWineType` to return `undefined` on ties**

In `lib/treemap-colors.ts`, replace the `dominantWineType` function:

```typescript
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
```

- [ ] **Step 4: Fix callers that expect string return**

The current `Treemap.tsx` imports `dominantWineType` and assigns the result to `dominantType: string` in the `RegionGroup` interface. Update the type to tolerate `undefined` so the build stays clean:

In `app/s/[shareId]/Treemap.tsx`, change the `RegionGroup` interface:

```typescript
interface RegionGroup {
  label: string;
  entries: ShareEntry[];
  dominantType: string | undefined;
}
```

Do not leave known type breakage in the tree. The old component is still part of the build until Task 10 removes it.

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd /Users/badday/dev/ios/vynr-app/vynr-web && npx tsx --test lib/__tests__/treemap-layout.test.ts`

Expected: All tests PASS (both existing squarify tests and new dominantWineType tests).

- [ ] **Step 6: Commit**

```bash
cd /Users/badday/dev/ios/vynr-app/vynr-web
git add lib/treemap-colors.ts lib/__tests__/treemap-layout.test.ts
git commit -m "feat: dominantWineType returns undefined on tie — Phase 2 prep"
```

---

### Task 2: Build `cellar-tree.ts` — types and `normalizeKey`

**Files:**
- Create: `lib/cellar-tree.ts`
- Create: `lib/__tests__/cellar-tree.test.ts`

- [ ] **Step 1: Write failing tests for `normalizeKey`**

Create `lib/__tests__/cellar-tree.test.ts`:

```typescript
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeKey } from '../cellar-tree';

describe('normalizeKey', () => {
  it('lowercases input', () => {
    assert.equal(normalizeKey('France'), 'france');
  });

  it('trims whitespace', () => {
    assert.equal(normalizeKey('  Burgundy  '), 'burgundy');
  });

  it('collapses internal whitespace', () => {
    assert.equal(normalizeKey('Napa  Valley'), 'napa valley');
  });

  it('handles empty string', () => {
    assert.equal(normalizeKey(''), '');
  });

  it('preserves diacritics', () => {
    assert.equal(normalizeKey('Côtes du Rhône'), 'côtes du rhône');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/badday/dev/ios/vynr-app/vynr-web && npx tsx --test lib/__tests__/cellar-tree.test.ts`

Expected: FAIL — module not found.

- [ ] **Step 3: Create `cellar-tree.ts` with types and `normalizeKey`**

Create `lib/cellar-tree.ts`:

```typescript
/**
 * Cellar hierarchy builder for web treemap browser.
 *
 * Pure TypeScript. No React. No layout concerns. No async.
 * Builds a navigable tree from flat ShareEntry[] pack data.
 *
 * Spec: docs/superpowers/specs/2026-04-08-navigable-web-treemap-design.md
 */

import type { ShareEntry } from './share-api';
import { dominantWineType } from './treemap-colors';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CellarNode {
  id: string;
  label: string;
  kind: 'country' | 'region' | 'appellation' | 'wine';
  wineType?: string;
  weight: number;
  children: CellarNode[];
  entry?: ShareEntry;
}

// ─── Key normalization ──────────────────────────────────────────────────────

/**
 * Normalize a geography string for use in node IDs.
 * Lowercase, trimmed, internal whitespace collapsed.
 *
 * Normalization is intentionally NOT ASCII-slugification.
 * Display-derived keys remain human-legible and deterministic within
 * the pack. Diacritics are preserved ("côtes du rhône", not "cotes-du-rhone").
 * Do not "improve" this to strip accents — it would break path determinism.
 */
export function normalizeKey(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ');
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/badday/dev/ios/vynr-app/vynr-web && npx tsx --test lib/__tests__/cellar-tree.test.ts`

Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/badday/dev/ios/vynr-app/vynr-web
git add lib/cellar-tree.ts lib/__tests__/cellar-tree.test.ts
git commit -m "feat: cellar-tree types and normalizeKey"
```

---

### Task 3: Build `buildHierarchy`

**Files:**
- Modify: `lib/cellar-tree.ts`
- Modify: `lib/__tests__/cellar-tree.test.ts`

- [ ] **Step 1: Write failing tests for `buildHierarchy`**

Add to `lib/__tests__/cellar-tree.test.ts`:

```typescript
import { buildHierarchy, normalizeKey, type CellarNode } from '../cellar-tree';
import type { ShareEntry } from '../share-api';

function makeEntry(overrides: Partial<ShareEntry> & { wineName: string; country: string; wineType: string; externalEntryId: string }): ShareEntry {
  return {
    externalEntryId: overrides.externalEntryId,
    wineName: overrides.wineName,
    wineType: overrides.wineType,
    country: overrides.country,
    region: overrides.region,
    appellation: overrides.appellation,
    producer: overrides.producer,
    vintage: overrides.vintage,
    varietals: overrides.varietals,
    providerNote: overrides.providerNote,
  };
}

describe('buildHierarchy', () => {
  it('returns empty array for no entries', () => {
    const result = buildHierarchy([]);
    assert.equal(result.length, 0);
  });

  it('groups entries by country at root level', () => {
    const entries = [
      makeEntry({ externalEntryId: 'a', wineName: 'Wine A', wineType: 'red', country: 'France', region: 'Burgundy' }),
      makeEntry({ externalEntryId: 'b', wineName: 'Wine B', wineType: 'red', country: 'Italy', region: 'Piedmont' }),
    ];
    const roots = buildHierarchy(entries);
    assert.equal(roots.length, 2);
    assert.ok(roots.some(r => r.label === 'France'));
    assert.ok(roots.some(r => r.label === 'Italy'));
  });

  it('nests regions under countries', () => {
    const entries = [
      makeEntry({ externalEntryId: 'a', wineName: 'Wine A', wineType: 'red', country: 'France', region: 'Burgundy' }),
      makeEntry({ externalEntryId: 'b', wineName: 'Wine B', wineType: 'white', country: 'France', region: 'Bordeaux' }),
    ];
    const roots = buildHierarchy(entries);
    assert.equal(roots.length, 1);
    const france = roots[0];
    assert.equal(france.label, 'France');
    assert.equal(france.children.length, 2);
    assert.equal(france.weight, 2);
  });

  it('nests appellations under regions', () => {
    const entries = [
      makeEntry({ externalEntryId: 'a', wineName: 'Wine A', wineType: 'red', country: 'France', region: 'Burgundy', appellation: 'Volnay' }),
      makeEntry({ externalEntryId: 'b', wineName: 'Wine B', wineType: 'red', country: 'France', region: 'Burgundy', appellation: 'Pommard' }),
    ];
    const roots = buildHierarchy(entries);
    const burgundy = roots[0].children[0];
    assert.equal(burgundy.label, 'Burgundy');
    assert.equal(burgundy.children.length, 2);
  });

  it('collapses missing appellation — wines nest under region', () => {
    const entries = [
      makeEntry({ externalEntryId: 'a', wineName: 'Wine A', wineType: 'red', country: 'France', region: 'Burgundy' }),
    ];
    const roots = buildHierarchy(entries);
    const burgundy = roots[0].children[0];
    assert.equal(burgundy.children.length, 1);
    assert.equal(burgundy.children[0].kind, 'wine');
  });

  it('collapses missing region — wines nest under country', () => {
    const entries = [
      makeEntry({ externalEntryId: 'a', wineName: 'Wine A', wineType: 'red', country: 'France' }),
    ];
    const roots = buildHierarchy(entries);
    assert.equal(roots[0].children.length, 1);
    assert.equal(roots[0].children[0].kind, 'wine');
  });

  it('aggregates weights bottom-up', () => {
    const entries = [
      makeEntry({ externalEntryId: 'a', wineName: 'A', wineType: 'red', country: 'France', region: 'Burgundy', appellation: 'Volnay' }),
      makeEntry({ externalEntryId: 'b', wineName: 'B', wineType: 'red', country: 'France', region: 'Burgundy', appellation: 'Volnay' }),
      makeEntry({ externalEntryId: 'c', wineName: 'C', wineType: 'white', country: 'France', region: 'Bordeaux' }),
    ];
    const roots = buildHierarchy(entries);
    assert.equal(roots[0].weight, 3); // France
    const burgundy = roots[0].children.find(c => c.label === 'Burgundy')!;
    assert.equal(burgundy.weight, 2);
  });

  it('sorts children by weight desc then label alpha', () => {
    const entries = [
      makeEntry({ externalEntryId: 'a', wineName: 'A', wineType: 'red', country: 'France', region: 'Bordeaux' }),
      makeEntry({ externalEntryId: 'b', wineName: 'B', wineType: 'red', country: 'France', region: 'Burgundy' }),
      makeEntry({ externalEntryId: 'c', wineName: 'C', wineType: 'red', country: 'France', region: 'Burgundy' }),
    ];
    const roots = buildHierarchy(entries);
    // Burgundy (2) before Bordeaux (1)
    assert.equal(roots[0].children[0].label, 'Burgundy');
    assert.equal(roots[0].children[1].label, 'Bordeaux');
  });

  it('alpha tie-breaker when weights are equal', () => {
    const entries = [
      makeEntry({ externalEntryId: 'a', wineName: 'A', wineType: 'red', country: 'France', region: 'Bordeaux' }),
      makeEntry({ externalEntryId: 'b', wineName: 'B', wineType: 'red', country: 'France', region: 'Alsace' }),
    ];
    const roots = buildHierarchy(entries);
    // Equal weight — Alsace before Bordeaux alphabetically
    assert.equal(roots[0].children[0].label, 'Alsace');
    assert.equal(roots[0].children[1].label, 'Bordeaux');
  });

  it('wine node IDs include parent path', () => {
    const entries = [
      makeEntry({ externalEntryId: 'abc', wineName: 'A', wineType: 'red', country: 'France', region: 'Burgundy' }),
    ];
    const roots = buildHierarchy(entries);
    const wine = roots[0].children[0].children[0];
    assert.equal(wine.id, 'wine:france/burgundy/abc');
  });

  it('node IDs are normalized', () => {
    const entries = [
      makeEntry({ externalEntryId: 'a', wineName: 'A', wineType: 'red', country: '  France  ', region: 'BURGUNDY' }),
    ];
    const roots = buildHierarchy(entries);
    assert.equal(roots[0].id, 'country:france');
    assert.equal(roots[0].children[0].id, 'region:france/burgundy');
  });

  it('is deterministic — same input produces same output', () => {
    const entries = [
      makeEntry({ externalEntryId: 'a', wineName: 'A', wineType: 'red', country: 'France', region: 'Burgundy' }),
      makeEntry({ externalEntryId: 'b', wineName: 'B', wineType: 'white', country: 'Italy', region: 'Piedmont' }),
      makeEntry({ externalEntryId: 'c', wineName: 'C', wineType: 'red', country: 'France', region: 'Bordeaux' }),
    ];
    const a = JSON.stringify(buildHierarchy(entries));
    const b = JSON.stringify(buildHierarchy(entries));
    assert.equal(a, b);
  });

  it('sets wineType on group nodes from dominant type', () => {
    const entries = [
      makeEntry({ externalEntryId: 'a', wineName: 'A', wineType: 'red', country: 'France', region: 'Burgundy' }),
      makeEntry({ externalEntryId: 'b', wineName: 'B', wineType: 'red', country: 'France', region: 'Burgundy' }),
    ];
    const roots = buildHierarchy(entries);
    assert.equal(roots[0].wineType, 'red');
  });

  it('sets wineType undefined on group nodes when tied', () => {
    const entries = [
      makeEntry({ externalEntryId: 'a', wineName: 'A', wineType: 'red', country: 'France', region: 'Burgundy' }),
      makeEntry({ externalEntryId: 'b', wineName: 'B', wineType: 'white', country: 'France', region: 'Burgundy' }),
    ];
    const roots = buildHierarchy(entries);
    assert.equal(roots[0].wineType, undefined);
  });

  it('handles mixed missing geography within same country', () => {
    const entries = [
      makeEntry({ externalEntryId: 'a', wineName: 'Direct', wineType: 'red', country: 'France' }),
      makeEntry({ externalEntryId: 'b', wineName: 'Regional', wineType: 'white', country: 'France', region: 'Burgundy' }),
      makeEntry({ externalEntryId: 'c', wineName: 'Full', wineType: 'red', country: 'France', region: 'Burgundy', appellation: 'Volnay' }),
    ];
    const roots = buildHierarchy(entries);
    const france = roots[0];
    assert.equal(france.weight, 3);
    // France should have: Burgundy (region, weight 2) + Direct (wine, weight 1)
    assert.equal(france.children.length, 2);
    const burgundy = france.children.find(c => c.kind === 'region')!;
    assert.equal(burgundy.label, 'Burgundy');
    assert.equal(burgundy.weight, 2);
    // Burgundy should have: Volnay (appellation, weight 1) + Regional (wine, weight 1)
    assert.equal(burgundy.children.length, 2);
    const direct = france.children.find(c => c.kind === 'wine')!;
    assert.equal(direct.entry?.wineName, 'Direct');
  });

  it('wine leaves have entry and weight 1', () => {
    const entries = [
      makeEntry({ externalEntryId: 'a', wineName: 'Wine A', wineType: 'red', country: 'France' }),
    ];
    const roots = buildHierarchy(entries);
    const wine = roots[0].children[0];
    assert.equal(wine.kind, 'wine');
    assert.equal(wine.weight, 1);
    assert.equal(wine.entry?.wineName, 'Wine A');
    assert.equal(wine.children.length, 0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/badday/dev/ios/vynr-app/vynr-web && npx tsx --test lib/__tests__/cellar-tree.test.ts`

Expected: FAIL — `buildHierarchy` not exported.

- [ ] **Step 3: Implement `buildHierarchy`**

Add to `lib/cellar-tree.ts`:

```typescript
// ─── Hierarchy building ─────────────────────────────────────────────────────

interface MutableNode {
  id: string;
  label: string;
  kind: CellarNode['kind'];
  children: Map<string, MutableNode>;
  wines: ShareEntry[];
}

function getOrCreateChild(parent: MutableNode, id: string, label: string, kind: CellarNode['kind']): MutableNode {
  let child = parent.children.get(id);
  if (!child) {
    child = { id, label, kind, children: new Map(), wines: [] };
    parent.children.set(id, child);
  }
  return child;
}

// Clarity over optimization: recursive collection is O(n) per node during finalization.
// For share-sized packs (tens to low hundreds of wines), this is fine.
// Optimize only if real packs make it necessary.
function collectWineTypes(node: MutableNode): string[] {
  const types: string[] = [];
  for (const wine of node.wines) {
    types.push(wine.wineType);
  }
  for (const child of node.children.values()) {
    types.push(...collectWineTypes(child));
  }
  return types;
}

function finalize(node: MutableNode): CellarNode[] {
  const results: CellarNode[] = [];

  for (const child of node.children.values()) {
    const finalized = finalizeNode(child);
    results.push(finalized);
  }

  // Add wine leaves directly under this node
  for (const wine of node.wines) {
    const parentPath = node.id.includes(':') ? node.id.split(':')[1] : '';
    results.push({
      id: `wine:${parentPath ? parentPath + '/' : ''}${wine.externalEntryId}`,
      label: wine.wineName,
      kind: 'wine',
      wineType: wine.wineType.toLowerCase(),
      weight: 1,
      children: [],
      entry: wine,
    });
  }

  // Sort: weight descending, then normalized label alphabetical (locale-stable)
  results.sort((a, b) => b.weight - a.weight || normalizeKey(a.label).localeCompare(normalizeKey(b.label)));

  return results;
}

function finalizeNode(node: MutableNode): CellarNode {
  const children = finalize(node);
  const weight = children.reduce((sum, c) => sum + c.weight, 0);
  const wineTypes = collectWineTypes(node);
  const wineType = dominantWineType(wineTypes);

  return {
    id: node.id,
    label: node.label,
    kind: node.kind,
    wineType,
    weight,
    children,
  };
}

/**
 * Build a navigable hierarchy from flat pack entries.
 *
 * Returns country-level root nodes. Missing geography levels collapse
 * upward gracefully. Tree construction is deterministic for a given input set.
 */
export function buildHierarchy(entries: ShareEntry[]): CellarNode[] {
  const root: MutableNode = { id: 'root', label: 'root', kind: 'country', children: new Map(), wines: [] };

  for (const entry of entries) {
    // Trim display labels to avoid visual whitespace artifacts from pack data
    const countryLabel = entry.country.trim();
    const countryKey = normalizeKey(entry.country);
    const countryId = `country:${countryKey}`;
    const country = getOrCreateChild(root, countryId, countryLabel, 'country');

    if (entry.region) {
      const regionLabel = entry.region.trim();
      const regionKey = normalizeKey(entry.region);
      const regionId = `region:${countryKey}/${regionKey}`;
      const region = getOrCreateChild(country, regionId, regionLabel, 'region');

      if (entry.appellation) {
        const appLabel = entry.appellation.trim();
        const appKey = normalizeKey(entry.appellation);
        const appId = `appellation:${countryKey}/${regionKey}/${appKey}`;
        const appellation = getOrCreateChild(region, appId, appLabel, 'appellation');
        appellation.wines.push(entry);
      } else {
        region.wines.push(entry);
      }
    } else {
      country.wines.push(entry);
    }
  }

  // Finalize: aggregate weights, compute dominant types, sort, convert to CellarNode[]
  const roots = finalize(root);
  return roots;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/badday/dev/ios/vynr-app/vynr-web && npx tsx --test lib/__tests__/cellar-tree.test.ts`

Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/badday/dev/ios/vynr-app/vynr-web
git add lib/cellar-tree.ts lib/__tests__/cellar-tree.test.ts
git commit -m "feat: buildHierarchy — deterministic tree from pack entries"
```

---

### Task 4: Build traversal functions and indexes

**Files:**
- Modify: `lib/cellar-tree.ts`
- Modify: `lib/__tests__/cellar-tree.test.ts`

- [ ] **Step 1: Write failing tests for traversal functions**

Add to `lib/__tests__/cellar-tree.test.ts`:

```typescript
import {
  buildHierarchy,
  normalizeKey,
  resolveScope,
  resolveCurrentNode,
  breadcrumbSegments,
  isLeafLevel,
  isWineNode,
  canDrill,
  flattenWines,
  buildNodeIndex,
  buildWineIndex,
  type CellarNode,
} from '../cellar-tree';

// (reuse makeEntry helper from Task 3)

const FIXTURE_ENTRIES = [
  makeEntry({ externalEntryId: 'a', wineName: 'Volnay 1er', wineType: 'red', country: 'France', region: 'Burgundy', appellation: 'Volnay' }),
  makeEntry({ externalEntryId: 'b', wineName: 'Pommard', wineType: 'red', country: 'France', region: 'Burgundy', appellation: 'Pommard' }),
  makeEntry({ externalEntryId: 'c', wineName: 'Barolo', wineType: 'red', country: 'Italy', region: 'Piedmont', appellation: 'Barolo' }),
  makeEntry({ externalEntryId: 'd', wineName: 'Chianti', wineType: 'red', country: 'Italy', region: 'Tuscany' }),
];

describe('resolveScope', () => {
  it('returns roots for empty path', () => {
    const roots = buildHierarchy(FIXTURE_ENTRIES);
    const { children, resolvedPath } = resolveScope(roots, []);
    assert.equal(children.length, 2); // France, Italy
    assert.deepEqual(resolvedPath, []);
  });

  it('returns country children for country path', () => {
    const roots = buildHierarchy(FIXTURE_ENTRIES);
    const { children } = resolveScope(roots, ['country:france']);
    assert.ok(children.some(c => c.label === 'Burgundy'));
  });

  it('returns closest valid ancestor for stale path', () => {
    const roots = buildHierarchy(FIXTURE_ENTRIES);
    const { children, resolvedPath } = resolveScope(roots, ['country:france', 'region:france/nonexistent']);
    // Should fall back to France's children
    assert.ok(children.some(c => c.label === 'Burgundy'));
    assert.deepEqual(resolvedPath, ['country:france']);
  });

  it('returns roots for completely invalid path', () => {
    const roots = buildHierarchy(FIXTURE_ENTRIES);
    const { children, resolvedPath } = resolveScope(roots, ['country:nonexistent']);
    assert.equal(children.length, 2); // roots
    assert.deepEqual(resolvedPath, []);
  });
});

describe('resolveCurrentNode', () => {
  it('returns null for empty path (root)', () => {
    const roots = buildHierarchy(FIXTURE_ENTRIES);
    assert.equal(resolveCurrentNode(roots, []), null);
  });

  it('returns the node for valid path', () => {
    const roots = buildHierarchy(FIXTURE_ENTRIES);
    const node = resolveCurrentNode(roots, ['country:france']);
    assert.equal(node?.label, 'France');
  });

  it('returns last valid node for stale path', () => {
    const roots = buildHierarchy(FIXTURE_ENTRIES);
    const node = resolveCurrentNode(roots, ['country:france', 'region:france/nonexistent']);
    // Last valid node is France
    assert.equal(node?.label, 'France');
  });
});

describe('breadcrumbSegments', () => {
  it('returns empty for root path', () => {
    const roots = buildHierarchy(FIXTURE_ENTRIES);
    const segments = breadcrumbSegments(roots, []);
    assert.equal(segments.length, 0);
  });

  it('returns segments for deep path', () => {
    const roots = buildHierarchy(FIXTURE_ENTRIES);
    const segments = breadcrumbSegments(roots, [
      'country:france',
      'region:france/burgundy',
    ]);
    assert.equal(segments.length, 2);
    assert.equal(segments[0].label, 'France');
    assert.equal(segments[1].label, 'Burgundy');
  });
});

describe('isLeafLevel', () => {
  it('returns true when all children are wines', () => {
    const roots = buildHierarchy(FIXTURE_ENTRIES);
    // Volnay appellation has only wine children
    const volnay = roots.find(r => r.label === 'France')!
      .children.find(c => c.label === 'Burgundy')!
      .children.find(c => c.label === 'Volnay')!;
    assert.equal(isLeafLevel(volnay), true);
  });

  it('returns false when children are groups', () => {
    const roots = buildHierarchy(FIXTURE_ENTRIES);
    const france = roots.find(r => r.label === 'France')!;
    assert.equal(isLeafLevel(france), false);
  });

  it('returns false for empty children', () => {
    const node: CellarNode = { id: 'test', label: 'Test', kind: 'region', weight: 0, children: [] };
    assert.equal(isLeafLevel(node), false);
  });
});

describe('isWineNode', () => {
  it('returns true for wine kind', () => {
    const node: CellarNode = { id: 'w', label: 'W', kind: 'wine', weight: 1, children: [] };
    assert.equal(isWineNode(node), true);
  });

  it('returns false for non-wine kind', () => {
    const node: CellarNode = { id: 'c', label: 'C', kind: 'country', weight: 1, children: [] };
    assert.equal(isWineNode(node), false);
  });
});

describe('canDrill', () => {
  it('returns true for group with children', () => {
    const roots = buildHierarchy(FIXTURE_ENTRIES);
    assert.equal(canDrill(roots[0]), true);
  });

  it('returns false for wine node', () => {
    const node: CellarNode = { id: 'w', label: 'W', kind: 'wine', weight: 1, children: [
      { id: 'x', label: 'X', kind: 'wine', weight: 1, children: [] }
    ] };
    assert.equal(canDrill(node), false);
  });

  it('returns false for empty group', () => {
    const node: CellarNode = { id: 'c', label: 'C', kind: 'country', weight: 0, children: [] };
    assert.equal(canDrill(node), false);
  });
});

describe('flattenWines', () => {
  it('collects all wine entries recursively', () => {
    const roots = buildHierarchy(FIXTURE_ENTRIES);
    const france = roots.find(r => r.label === 'France')!;
    const wines = flattenWines(france);
    assert.equal(wines.length, 2); // Volnay 1er + Pommard
  });
});

describe('buildNodeIndex', () => {
  it('indexes all nodes by ID', () => {
    const roots = buildHierarchy(FIXTURE_ENTRIES);
    const index = buildNodeIndex(roots);
    assert.ok(index.get('country:france'));
    assert.ok(index.get('region:france/burgundy'));
    assert.ok(index.get('country:italy'));
  });
});

describe('buildWineIndex', () => {
  it('indexes all wine entries by wine node ID', () => {
    const roots = buildHierarchy(FIXTURE_ENTRIES);
    const index = buildWineIndex(roots);
    assert.equal(index.size, 4);
    const volnay = index.get('wine:france/burgundy/volnay/a');
    assert.equal(volnay?.wineName, 'Volnay 1er');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/badday/dev/ios/vynr-app/vynr-web && npx tsx --test lib/__tests__/cellar-tree.test.ts`

Expected: FAIL — functions not exported.

- [ ] **Step 3: Implement all traversal functions and indexes**

Add to `lib/cellar-tree.ts`:

```typescript
// ─── Traversal ──────────────────────────────────────────────────────────────

/**
 * Resolve the current scope from a path.
 * Returns the children to render and the validated path.
 * Falls back to closest valid ancestor if path is stale.
 */
export function resolveScope(
  roots: CellarNode[],
  pathIds: string[],
): { children: CellarNode[]; resolvedPath: string[] } {
  let current = roots;
  const resolvedPath: string[] = [];

  for (const id of pathIds) {
    const found = current.find((n) => n.id === id);
    if (!found) break;
    resolvedPath.push(id);
    current = found.children;
  }

  return { children: current, resolvedPath };
}

/**
 * Resolve the current node itself. Returns null at root level.
 */
export function resolveCurrentNode(
  roots: CellarNode[],
  pathIds: string[],
): CellarNode | null {
  if (pathIds.length === 0) return null;

  let current = roots;
  let node: CellarNode | null = null;

  for (const id of pathIds) {
    const found = current.find((n) => n.id === id);
    if (!found) break;
    node = found;
    current = found.children;
  }

  return node;
}

/**
 * Breadcrumb segments for the current path.
 * Each segment has the node's id and label.
 */
export function breadcrumbSegments(
  roots: CellarNode[],
  pathIds: string[],
): { id: string; label: string }[] {
  const segments: { id: string; label: string }[] = [];
  let current = roots;

  for (const id of pathIds) {
    const found = current.find((n) => n.id === id);
    if (!found) break;
    segments.push({ id: found.id, label: found.label });
    current = found.children;
  }

  return segments;
}

/** True when node has children and all children are wine leaves. */
export function isLeafLevel(node: CellarNode): boolean {
  return node.children.length > 0 && node.children.every((c) => c.kind === 'wine');
}

/** True when node is a wine leaf. */
export function isWineNode(node: CellarNode): boolean {
  return node.kind === 'wine';
}

/** True when node can be drilled into. */
export function canDrill(node: CellarNode): boolean {
  return node.children.length > 0 && node.kind !== 'wine';
}

/** Recursively collect all wine entries under a node. */
export function flattenWines(node: CellarNode): ShareEntry[] {
  if (node.entry) return [node.entry];
  const result: ShareEntry[] = [];
  for (const child of node.children) {
    result.push(...flattenWines(child));
  }
  return result;
}

// ─── Indexes ────────────────────────────────────────────────────────────────

/** Build a Map of all nodes by ID for O(1) lookup. */
export function buildNodeIndex(roots: CellarNode[]): Map<string, CellarNode> {
  const index = new Map<string, CellarNode>();
  function walk(nodes: CellarNode[]) {
    for (const node of nodes) {
      index.set(node.id, node);
      walk(node.children);
    }
  }
  walk(roots);
  return index;
}

/** Build a Map of wine entries by wine node ID for O(1) selection. */
export function buildWineIndex(roots: CellarNode[]): Map<string, ShareEntry> {
  const index = new Map<string, ShareEntry>();
  function walk(nodes: CellarNode[]) {
    for (const node of nodes) {
      if (node.entry) {
        index.set(node.id, node.entry);
      }
      walk(node.children);
    }
  }
  walk(roots);
  return index;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/badday/dev/ios/vynr-app/vynr-web && npx tsx --test lib/__tests__/cellar-tree.test.ts`

Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/badday/dev/ios/vynr-app/vynr-web
git add lib/cellar-tree.ts lib/__tests__/cellar-tree.test.ts
git commit -m "feat: cellar-tree traversal, indexes, and query functions"
```

---

### Task 5: Extract shared `WineCard` component

**Files:**
- Create: `app/components/WineCard.tsx`

- [ ] **Step 1: Create shared WineCard component**

Extract the wine card rendering from `app/s/[shareId]/page.tsx:99-213` into a neutral shared component. Read the current `WineCard` function in `page.tsx` first, then create the extracted version.

Create `app/components/WineCard.tsx`:

```tsx
import type { ShareEntry } from '@/lib/share-api';
import { wineTypeTint, wineTypeColor, wineTypeBorder } from '@/lib/treemap-colors';

const WINE_TYPE_LABELS: Record<string, string> = {
  red: 'Red', white: 'White', rosé: 'Rosé', rose: 'Rosé',
  sparkling: 'Sparkling', dessert: 'Dessert', fortified: 'Fortified',
  orange: 'Orange',
};

function wineTypeStyle(wineType: string) {
  const key = wineType.toLowerCase();
  return {
    label: WINE_TYPE_LABELS[key] ?? wineType,
    bg: wineTypeTint(key),
    color: wineTypeColor(key),
    borderColor: wineTypeBorder(key),
  };
}

function geographyLine(entry: ShareEntry): string {
  const parts = [entry.country, entry.region, entry.appellation].filter(Boolean);
  return parts.join(' \u00B7 ');
}

interface WineCardProps {
  entry: ShareEntry;
  onClick?: () => void;
}

export function WineCard({ entry, onClick }: WineCardProps) {
  const typeStyle = wineTypeStyle(entry.wineType);
  const geo = geographyLine(entry);

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      style={{
        background: 'var(--atlas-card)',
        border: '1px solid var(--atlas-card-stroke)',
        borderRadius: 10,
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {/* Name row + type pill */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--atlas-text)', lineHeight: 1.35, flex: 1 }}>
          {entry.wineName}
        </span>
        <span
          style={{
            fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const,
            padding: '3px 8px', borderRadius: 20, flexShrink: 0, marginTop: 2,
            background: typeStyle.bg, color: typeStyle.color, border: `1px solid ${typeStyle.borderColor}`,
          }}
        >
          {typeStyle.label}
        </span>
      </div>

      {/* Producer + vintage */}
      {(entry.producer || entry.vintage) && (
        <div style={{ fontSize: '0.82rem', color: 'var(--atlas-text-secondary)', lineHeight: 1.4 }}>
          {[entry.producer, entry.vintage].filter(Boolean).join(' \u00B7 ')}
        </div>
      )}

      {/* Geography */}
      {geo && (
        <div style={{ fontSize: '0.75rem', color: 'var(--atlas-text-placeholder)', letterSpacing: '0.01em' }}>
          {geo}
        </div>
      )}

      {/* Varietals */}
      {entry.varietals && entry.varietals.length > 0 && (
        <div style={{ fontSize: '0.72rem', color: 'var(--atlas-text-placeholder)' }}>
          {entry.varietals.join(', ')}
        </div>
      )}

      {/* Provider note */}
      {entry.providerNote && (
        <div
          style={{
            marginTop: 6, padding: '9px 12px', background: 'var(--atlas-bg)',
            border: '1px solid var(--atlas-separator)', borderRadius: 6,
            fontSize: '0.82rem', color: 'var(--atlas-text-secondary)', fontStyle: 'italic', lineHeight: 1.55,
          }}
        >
          {entry.providerNote}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build succeeds**

Run: `cd /Users/badday/dev/ios/vynr-app/vynr-web && npx next build 2>&1 | tail -10`

Expected: Build succeeds (component is not yet imported, but should compile).

- [ ] **Step 3: Commit**

```bash
cd /Users/badday/dev/ios/vynr-app/vynr-web
git add app/components/WineCard.tsx
git commit -m "feat: extract shared WineCard component for reuse"
```

---

### Task 6: Build `ViewToggle` and `Breadcrumb` components

**Files:**
- Create: `app/s/[shareId]/ViewToggle.tsx`
- Create: `app/s/[shareId]/Breadcrumb.tsx`

- [ ] **Step 1: Create ViewToggle**

Create `app/s/[shareId]/ViewToggle.tsx`:

```tsx
'use client';

interface ViewToggleProps {
  viewMode: 'treemap' | 'list';
  onToggle: (mode: 'treemap' | 'list') => void;
}

export function ViewToggle({ viewMode, onToggle }: ViewToggleProps) {
  return (
    <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
      <button
        onClick={() => onToggle('treemap')}
        aria-label="Treemap view"
        aria-pressed={viewMode === 'treemap'}
        style={{
          padding: '4px 8px',
          borderRadius: '4px 0 0 4px',
          border: '1px solid var(--atlas-card-stroke)',
          background: viewMode === 'treemap' ? 'var(--atlas-card)' : 'transparent',
          color: viewMode === 'treemap' ? 'var(--atlas-text)' : 'var(--atlas-text-placeholder)',
          cursor: 'pointer',
          fontSize: '0.72rem',
          fontWeight: viewMode === 'treemap' ? 600 : 400,
          lineHeight: 1,
        }}
      >
        {/* Grid icon — 4 squares */}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <rect x="1" y="1" width="5" height="5" rx="1" fill="currentColor" />
          <rect x="8" y="1" width="5" height="5" rx="1" fill="currentColor" />
          <rect x="1" y="8" width="5" height="5" rx="1" fill="currentColor" />
          <rect x="8" y="8" width="5" height="5" rx="1" fill="currentColor" />
        </svg>
      </button>
      <button
        onClick={() => onToggle('list')}
        aria-label="List view"
        aria-pressed={viewMode === 'list'}
        style={{
          padding: '4px 8px',
          borderRadius: '0 4px 4px 0',
          border: '1px solid var(--atlas-card-stroke)',
          borderLeft: 'none',
          background: viewMode === 'list' ? 'var(--atlas-card)' : 'transparent',
          color: viewMode === 'list' ? 'var(--atlas-text)' : 'var(--atlas-text-placeholder)',
          cursor: 'pointer',
          fontSize: '0.72rem',
          fontWeight: viewMode === 'list' ? 600 : 400,
          lineHeight: 1,
        }}
      >
        {/* List icon — 3 horizontal lines */}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <rect x="1" y="2" width="12" height="2" rx="1" fill="currentColor" />
          <rect x="1" y="6" width="12" height="2" rx="1" fill="currentColor" />
          <rect x="1" y="10" width="12" height="2" rx="1" fill="currentColor" />
        </svg>
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create Breadcrumb**

Create `app/s/[shareId]/Breadcrumb.tsx`:

```tsx
'use client';

import { useRef, useEffect } from 'react';

interface BreadcrumbSegment {
  id: string;
  label: string;
}

interface BreadcrumbProps {
  rootLabel: string;
  segments: BreadcrumbSegment[];
  pathIds: string[];
  onNavigate: (pathIds: string[]) => void;
}

export function Breadcrumb({ rootLabel, segments, pathIds, onNavigate }: BreadcrumbProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevPathLength = useRef(pathIds.length);

  // Auto-scroll to end on navigation change only
  useEffect(() => {
    if (pathIds.length !== prevPathLength.current && scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
    prevPathLength.current = pathIds.length;
  }, [pathIds]);

  const isAtRoot = segments.length === 0;

  return (
    <div
      ref={scrollRef}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        fontSize: '0.72rem',
        color: 'var(--atlas-text-secondary)',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        flex: 1,
        minWidth: 0,
        scrollbarWidth: 'none',
      }}
    >
      {/* Root segment */}
      {isAtRoot ? (
        <span style={{ color: 'var(--atlas-text)', fontWeight: 500 }}>
          {rootLabel}
        </span>
      ) : (
        <button
          onClick={() => onNavigate([])}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            color: 'var(--atlas-text-secondary)',
            fontSize: 'inherit',
            fontFamily: 'inherit',
          }}
        >
          {rootLabel}
        </button>
      )}

      {/* Path segments */}
      {segments.map((segment, i) => {
        const isTerminal = i === segments.length - 1;
        return (
          <span key={segment.id} style={{ display: 'inline-flex', alignItems: 'center' }}>
            <span style={{ margin: '0 6px', color: 'var(--atlas-text-placeholder)', opacity: 0.5 }}>
              ›
            </span>
            {isTerminal ? (
              <span style={{ color: 'var(--atlas-text)', fontWeight: 500 }}>
                {segment.label}
              </span>
            ) : (
              <button
                onClick={() => onNavigate(pathIds.slice(0, i + 1))}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: 'var(--atlas-text-secondary)',
                  fontSize: 'inherit',
                  fontFamily: 'inherit',
                }}
              >
                {segment.label}
              </button>
            )}
          </span>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/badday/dev/ios/vynr-app/vynr-web
git add app/s/\[shareId\]/ViewToggle.tsx app/s/\[shareId\]/Breadcrumb.tsx
git commit -m "feat: Breadcrumb and ViewToggle components"
```

---

### Task 7: Build `TreemapView` component

**Files:**
- Create: `app/s/[shareId]/TreemapView.tsx`

- [ ] **Step 1: Create TreemapView**

Create `app/s/[shareId]/TreemapView.tsx`:

```tsx
'use client';

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { squarify, type TreemapItem } from '@/lib/treemap-layout';
import {
  wineTypeTint,
  wineTypeHoverTint,
  wineTypeColor,
  wineTypeBorder,
} from '@/lib/treemap-colors';
import { type CellarNode, isWineNode, canDrill } from '@/lib/cellar-tree';

// ─── Tint helpers (tolerate undefined wineType) ─────────────────────────────

const NEUTRAL = { r: 0x8a, g: 0x7d, b: 0x68 };

function nodeTint(wineType: string | undefined, opacity: number = 0.10): string {
  if (!wineType) return `rgba(${NEUTRAL.r}, ${NEUTRAL.g}, ${NEUTRAL.b}, ${opacity})`;
  return wineTypeTint(wineType, opacity);
}

function nodeHoverTint(wineType: string | undefined): string {
  if (!wineType) return `rgba(${NEUTRAL.r}, ${NEUTRAL.g}, ${NEUTRAL.b}, 0.20)`;
  return wineTypeHoverTint(wineType);
}

function nodeColor(wineType: string | undefined): string {
  if (!wineType) return '#6B614E';
  return wineTypeColor(wineType);
}

function nodeBorder(wineType: string | undefined): string {
  if (!wineType) return `rgba(${NEUTRAL.r}, ${NEUTRAL.g}, ${NEUTRAL.b}, 0.25)`;
  return wineTypeBorder(wineType);
}

// ─── Wine tile label formatter ──────────────────────────────────────────────

function wineTileLabel(node: CellarNode): { primary: string; secondary?: string } {
  const entry = node.entry;
  if (!entry) return { primary: node.label };
  // Wine name is primary; producer as secondary when different
  return {
    primary: entry.wineName,
    secondary: entry.producer && entry.producer !== entry.wineName ? entry.producer : undefined,
  };
}

// ─── Tooltip data ───────────────────────────────────────────────────────────

interface TooltipData {
  content: { primary: string; secondary?: string };
  x: number;
  y: number;
}

// ─── Label thresholds ───────────────────────────────────────────────────────

const MIN_LABEL_DIM = 60;
const MIN_SUB_DIM = 40;

// ─── ResizeObserver hook ────────────────────────────────────────────────────

function useContainerWidth(ref: React.RefObject<HTMLDivElement | null>): number {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const w = Math.round(entry.contentRect.width);
        setWidth((prev) => prev === w ? prev : w);
      }
    });
    observer.observe(el);
    setWidth(Math.round(el.clientWidth));

    return () => observer.disconnect();
  }, [ref]);

  return width;
}

// ─── Component ──────────────────────────────────────────────────────────────

interface TreemapViewProps {
  nodes: CellarNode[];
  isTerminalPath: boolean;
  hoveredNodeId: string | null;
  onNodeClick: (node: CellarNode) => void;
  onNodeHover: (nodeId: string | null) => void;
  currentNode: CellarNode | null;
}

export function TreemapView({
  nodes,
  isTerminalPath,
  hoveredNodeId,
  onNodeClick,
  onNodeHover,
  currentNode,
}: TreemapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measuredWidth = useContainerWidth(containerRef);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [canHover, setCanHover] = useState(false);

  // Detect hover capability
  useEffect(() => {
    setCanHover(window.matchMedia('(hover: hover)').matches);
  }, []);

  // Height policy: 3:2 desktop, 4:3 mobile, clamped
  const isMobile = measuredWidth > 0 && measuredWidth < 480;
  const ratio = isMobile ? 4 / 3 : 3 / 2;
  const rawHeight = measuredWidth / ratio;
  const minH = isMobile ? 200 : 250;
  const maxH = isMobile ? 400 : 500;
  const computedHeight = Math.max(minH, Math.min(maxH, rawHeight));

  const items: TreemapItem[] = useMemo(
    () => nodes.map((n) => ({
      id: n.id,
      label: n.label,
      weight: n.weight,
      wineType: n.wineType,
    })),
    [nodes],
  );

  const rects = useMemo(
    () => measuredWidth > 0 ? squarify(items, measuredWidth, computedHeight, 2) : [],
    [items, measuredWidth, computedHeight],
  );

  // Build a lookup from id to CellarNode for click handling
  const nodeMap = useMemo(() => {
    const m = new Map<string, CellarNode>();
    for (const n of nodes) m.set(n.id, n);
    return m;
  }, [nodes]);

  const handleMouseEnter = useCallback((id: string, svgX: number, svgY: number) => {
    if (!canHover) return;
    onNodeHover(id);
    const node = nodeMap.get(id);
    if (!node) return;

    if (isWineNode(node) && node.entry) {
      setTooltip({
        content: {
          primary: node.entry.wineName,
          secondary: [node.entry.producer, node.entry.vintage].filter(Boolean).join(' \u00B7 '),
        },
        x: svgX,
        y: svgY,
      });
    } else {
      setTooltip({
        content: {
          primary: node.label,
          secondary: `${node.weight} ${node.weight === 1 ? 'wine' : 'wines'}`,
        },
        x: svgX,
        y: svgY,
      });
    }
  }, [canHover, onNodeHover, nodeMap]);

  const handleMouseLeave = useCallback(() => {
    onNodeHover(null);
    setTooltip(null);
  }, [onNodeHover]);

  const handleClick = useCallback((id: string) => {
    const node = nodeMap.get(id);
    if (node) onNodeClick(node);
  }, [nodeMap, onNodeClick]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(id);
    }
  }, [handleClick]);

  // Aria label for the treemap
  const ariaLabel = useMemo(() => {
    if (!currentNode) {
      return `${nodes.length} ${nodes.length === 1 ? 'country' : 'countries'}`;
    }
    if (isTerminalPath) {
      return `${nodes.length} ${nodes.length === 1 ? 'wine' : 'wines'} in ${currentNode.label}`;
    }
    return `${nodes.length} ${nodes.length === 1 ? 'region' : 'regions'} in ${currentNode.label}`;
  }, [nodes.length, currentNode, isTerminalPath]);

  if (measuredWidth === 0) {
    // Render container for measurement, content will appear on next frame
    return <div ref={containerRef} style={{ width: '100%', minHeight: minH }} />;
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <svg
        viewBox={`0 0 ${measuredWidth} ${computedHeight}`}
        width="100%"
        height={computedHeight}
        style={{
          display: 'block',
          borderRadius: 10,
          border: '1px solid var(--atlas-card-stroke)',
          background: 'var(--atlas-bg)',
          overflow: 'hidden',
        }}
        role="group"
        aria-label={ariaLabel}
      >
        {rects.map((r) => {
          const isHovered = hoveredNodeId === r.item.id;
          const wt = r.item.wineType;
          const minDim = Math.min(r.width, r.height);
          const showLabel = minDim >= MIN_LABEL_DIM;
          const showSub = minDim >= MIN_SUB_DIM;
          const isWine = isTerminalPath;

          const labelSize = Math.max(10, Math.min(14, Math.sqrt(r.width * r.height) / 8));
          const subSize = Math.max(8, labelSize - 2);

          // For wine tiles, use the formatter
          const labels = isWine ? wineTileLabel(nodeMap.get(r.item.id)!) : { primary: r.item.label, secondary: `${r.item.weight} ${r.item.weight === 1 ? 'wine' : 'wines'}` };

          return (
            <g
              key={r.item.id}
              onClick={() => handleClick(r.item.id)}
              onMouseEnter={() => handleMouseEnter(r.item.id, r.x + r.width / 2, r.y + r.height / 2)}
              onMouseLeave={handleMouseLeave}
              onKeyDown={(e) => handleKeyDown(e, r.item.id)}
              tabIndex={0}
              role="button"
              aria-label={isWine ? labels.primary : `${labels.primary}, ${r.item.weight} wines`}
              style={{ cursor: 'pointer', outline: 'none' }}
            >
              {/* Tile fill */}
              <rect
                x={r.x}
                y={r.y}
                width={r.width}
                height={r.height}
                rx={4}
                ry={4}
                fill={isHovered ? nodeHoverTint(wt) : nodeTint(wt)}
                stroke={isHovered && isWine ? nodeColor(wt) : nodeBorder(wt)}
                strokeWidth={isHovered && isWine ? 1.5 : 1}
                style={{ transition: 'fill 0.12s ease, stroke-width 0.12s ease' }}
              />

              {/* Focus ring */}
              <rect
                x={r.x}
                y={r.y}
                width={r.width}
                height={r.height}
                rx={4}
                ry={4}
                fill="none"
                stroke="var(--atlas-tint)"
                strokeWidth={2}
                opacity={0}
                className="focus-ring"
                style={{ pointerEvents: 'none' }}
              />

              {/* Primary label */}
              {showLabel && (
                <text
                  x={r.x + r.width / 2}
                  y={r.y + r.height / 2 - (showSub && labels.secondary ? subSize * 0.4 : 0)}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={nodeColor(wt)}
                  fontSize={labelSize}
                  fontWeight={500}
                  fontFamily="'Avenir Next', 'Avenir', 'Nunito Sans', 'Trebuchet MS', sans-serif"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {labels.primary}
                </text>
              )}

              {/* Sub-label */}
              {showSub && showLabel && labels.secondary && (
                <text
                  x={r.x + r.width / 2}
                  y={r.y + r.height / 2 + labelSize * 0.7}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={nodeColor(wt)}
                  fontSize={subSize}
                  fontWeight={400}
                  fontFamily="'Avenir Next', 'Avenir', 'Nunito Sans', 'Trebuchet MS', sans-serif"
                  opacity={0.6}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {labels.secondary}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Tooltip (desktop only) */}
      {tooltip && canHover && (
        <div
          style={{
            position: 'absolute',
            left: `${(tooltip.x / measuredWidth) * 100}%`,
            top: `${(tooltip.y / computedHeight) * 100}%`,
            transform: 'translate(-50%, -110%)',
            background: 'var(--atlas-card)',
            border: '1px solid var(--atlas-card-stroke)',
            borderRadius: 8,
            padding: '8px 12px',
            maxWidth: 200,
            pointerEvents: 'none',
            zIndex: 10,
            boxShadow: '0 2px 8px rgba(61, 53, 40, 0.10)',
          }}
        >
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--atlas-text)' }}>
            {tooltip.content.primary}
          </div>
          {tooltip.content.secondary && (
            <div style={{ fontSize: '0.68rem', color: 'var(--atlas-text-placeholder)', marginTop: 2 }}>
              {tooltip.content.secondary}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add focus-ring CSS to globals.css**

Add to `app/globals.css`:

```css
/* SVG treemap focus ring */
g:focus-visible .focus-ring {
  opacity: 1 !important;
}

/* Hide scrollbar on breadcrumb */
.breadcrumb-scroll::-webkit-scrollbar {
  display: none;
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/badday/dev/ios/vynr-app/vynr-web
git add app/s/\[shareId\]/TreemapView.tsx app/globals.css
git commit -m "feat: TreemapView with SVG rendering, hover, keyboard, tooltips"
```

---

### Task 8: Build `ListView` and `WineDetailPanel`

**Files:**
- Create: `app/s/[shareId]/ListView.tsx`
- Create: `app/s/[shareId]/WineDetailPanel.tsx`

- [ ] **Step 1: Create ListView**

Create `app/s/[shareId]/ListView.tsx`:

```tsx
'use client';

import { type CellarNode, canDrill, isWineNode } from '@/lib/cellar-tree';
import { wineTypeTint, wineTypeColor } from '@/lib/treemap-colors';
import { WineCard } from '@/app/components/WineCard';

interface ListViewProps {
  nodes: CellarNode[];
  isTerminalPath: boolean;
  onNodeClick: (node: CellarNode) => void;
}

export function ListView({ nodes, isTerminalPath, onNodeClick }: ListViewProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {nodes.map((node) => {
        if (canDrill(node)) {
          return (
            <button
              key={node.id}
              onClick={() => onNodeClick(node)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                minHeight: 48,
                padding: '12px 16px',
                background: 'var(--atlas-card)',
                border: '1px solid var(--atlas-card-stroke)',
                borderRadius: 10,
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
                borderLeft: node.wineType
                  ? `3px solid ${wineTypeTint(node.wineType, 0.4)}`
                  : '3px solid var(--atlas-card-stroke)',
              }}
            >
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--atlas-text)' }}>
                  {node.label}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--atlas-text-placeholder)', marginTop: 2 }}>
                  {node.weight} {node.weight === 1 ? 'wine' : 'wines'}
                </div>
              </div>
              {/* Chevron */}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, opacity: 0.4 }}>
                <path d="M6 3L11 8L6 13" stroke="var(--atlas-text-placeholder)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          );
        }

        if (isWineNode(node) && node.entry) {
          return (
            <WineCard
              key={node.id}
              entry={node.entry}
              onClick={() => onNodeClick(node)}
            />
          );
        }

        return null;
      })}
    </div>
  );
}
```

- [ ] **Step 2: Create WineDetailPanel**

Create `app/s/[shareId]/WineDetailPanel.tsx`:

```tsx
'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { ShareEntry } from '@/lib/share-api';
import { wineTypeTint, wineTypeColor, wineTypeBorder } from '@/lib/treemap-colors';

const WINE_TYPE_LABELS: Record<string, string> = {
  red: 'Red', white: 'White', rosé: 'Rosé', rose: 'Rosé',
  sparkling: 'Sparkling', dessert: 'Dessert', fortified: 'Fortified',
  orange: 'Orange',
};

interface WineDetailPanelProps {
  wine: ShareEntry | null;
  onDismiss: () => void;
}

export function WineDetailPanel({ wine, onDismiss }: WineDetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  // Focus management
  useEffect(() => {
    if (wine) {
      previousFocus.current = document.activeElement as HTMLElement;
      // Focus panel on next frame
      requestAnimationFrame(() => panelRef.current?.focus());
    } else if (previousFocus.current) {
      previousFocus.current.focus();
      previousFocus.current = null;
    }
  }, [wine]);

  // Escape to dismiss
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onDismiss();
    }
  }, [onDismiss]);

  // Lock body scroll on mobile when open
  useEffect(() => {
    if (wine) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [wine]);

  if (!wine) return null;

  const typeKey = wine.wineType.toLowerCase();
  const typeLabel = WINE_TYPE_LABELS[typeKey] ?? wine.wineType;
  const geo = [wine.country, wine.region, wine.appellation].filter(Boolean).join(' \u00B7 ');

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onDismiss}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          background: 'rgba(0, 0, 0, 0.15)',
        }}
        aria-hidden="true"
      />

      {/* Panel — desktop: right slide-over, mobile: bottom sheet */}
      <div
        ref={panelRef}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-label={`Wine detail: ${wine.wineName}`}
        style={{
          position: 'fixed',
          zIndex: 51,
          background: 'var(--atlas-bg)',
          border: '1px solid var(--atlas-card-stroke)',
          overflowY: 'auto',
          outline: 'none',
          /* Desktop: right slide-over */
          right: 0,
          top: 0,
          bottom: 0,
          width: 380,
          borderRadius: '0',
          borderLeft: '1px solid var(--atlas-card-stroke)',
        }}
        className="wine-detail-panel"
      >
        {/* Close button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 16px 0' }}>
          <button
            onClick={onDismiss}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              color: 'var(--atlas-text-placeholder)',
              fontSize: '1.2rem',
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '8px 24px 32px' }}>
          {/* Wine name */}
          <h2 style={{
            fontSize: '1.3rem', fontWeight: 600, color: 'var(--atlas-text)',
            lineHeight: 1.3, margin: '0 0 8px', letterSpacing: '-0.01em',
          }}>
            {wine.wineName}
          </h2>

          {/* Producer */}
          {wine.producer && (
            <div style={{ fontSize: '0.92rem', color: 'var(--atlas-text-secondary)', marginBottom: 6 }}>
              {wine.producer}
            </div>
          )}

          {/* Vintage */}
          {wine.vintage && (
            <div style={{ fontSize: '0.88rem', color: 'var(--atlas-text-secondary)', marginBottom: 12 }}>
              {wine.vintage}
            </div>
          )}

          {/* Geography */}
          {geo && (
            <div style={{
              fontSize: '0.78rem', color: 'var(--atlas-text-placeholder)',
              letterSpacing: '0.01em', marginBottom: 12,
            }}>
              {geo}
            </div>
          )}

          {/* Wine type pill */}
          <span style={{
            display: 'inline-block',
            fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.06em',
            textTransform: 'uppercase' as const,
            padding: '3px 10px', borderRadius: 20,
            background: wineTypeTint(typeKey),
            color: wineTypeColor(typeKey),
            border: `1px solid ${wineTypeBorder(typeKey)}`,
            marginBottom: 16,
          }}>
            {typeLabel}
          </span>

          {/* Varietals */}
          {wine.varietals && wine.varietals.length > 0 && (
            <div style={{
              fontSize: '0.78rem', color: 'var(--atlas-text-placeholder)', marginBottom: 16,
            }}>
              {wine.varietals.join(', ')}
            </div>
          )}

          {/* Provider note */}
          {wine.providerNote && (
            <div style={{
              padding: '12px 14px', background: 'var(--atlas-card)',
              border: '1px solid var(--atlas-separator)', borderRadius: 8,
              fontSize: '0.85rem', color: 'var(--atlas-text-secondary)',
              fontStyle: 'italic', lineHeight: 1.6,
            }}>
              {wine.providerNote}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 3: Add responsive panel CSS to globals.css**

Add to `app/globals.css`:

```css
/* Wine detail panel — mobile bottom sheet */
@media (max-width: 767px) {
  .wine-detail-panel {
    top: auto !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    width: 100% !important;
    max-height: 70vh !important;
    border-radius: 16px 16px 0 0 !important;
    border-left: none !important;
    border-top: 1px solid var(--atlas-card-stroke) !important;
    padding-bottom: env(safe-area-inset-bottom) !important;
  }
}
```

- [ ] **Step 4: Commit**

```bash
cd /Users/badday/dev/ios/vynr-app/vynr-web
git add app/s/\[shareId\]/ListView.tsx app/s/\[shareId\]/WineDetailPanel.tsx app/globals.css
git commit -m "feat: ListView and WineDetailPanel components"
```

---

### Task 9: Build `CellarBrowser` and wire into page

**Files:**
- Create: `app/s/[shareId]/CellarBrowser.tsx`
- Modify: `app/s/[shareId]/page.tsx`

- [ ] **Step 1: Create CellarBrowser**

Create `app/s/[shareId]/CellarBrowser.tsx`:

```tsx
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import type { ShareEntry } from '@/lib/share-api';
import {
  type CellarNode,
  resolveScope,
  resolveCurrentNode,
  breadcrumbSegments,
  isWineNode,
  canDrill,
  buildNodeIndex,
  buildWineIndex,
} from '@/lib/cellar-tree';
import { Breadcrumb } from './Breadcrumb';
import { ViewToggle } from './ViewToggle';
import { TreemapView } from './TreemapView';
import { ListView } from './ListView';
import { WineDetailPanel } from './WineDetailPanel';

interface CellarBrowserProps {
  tree: CellarNode[];
  rootLabel: string;
  shareId: string;
}

export function CellarBrowser({ tree, rootLabel, shareId }: CellarBrowserProps) {
  const [pathIds, setPathIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'treemap' | 'list'>('treemap');
  const [selectedWineId, setSelectedWineId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Indexes — built once per page lifecycle from the immutable tree prop.
  // Dependency is [tree] which never changes (server-built, passed as prop).
  // These are NOT rebuilt on navigation, toggle, or selection changes.
  const wineIndex = useMemo(() => buildWineIndex(tree), [tree]);

  // Derived state — resolveScope trims stale paths to closest valid ancestor
  const { children: currentChildren, resolvedPath } = useMemo(
    () => resolveScope(tree, pathIds),
    [tree, pathIds],
  );

  // Reconcile stale path: if resolveScope trimmed the path, sync state
  useEffect(() => {
    if (resolvedPath.length !== pathIds.length || !resolvedPath.every((id, i) => id === pathIds[i])) {
      setPathIds(resolvedPath);
    }
  }, [resolvedPath, pathIds]);

  const currentNode = useMemo(
    () => resolveCurrentNode(tree, resolvedPath),
    [tree, resolvedPath],
  );

  const breadcrumb = useMemo(
    () => breadcrumbSegments(tree, resolvedPath),
    [tree, resolvedPath],
  );

  const isTerminalPath = useMemo(
    () => currentChildren.length > 0 && currentChildren.every(isWineNode),
    [currentChildren],
  );

  const selectedWine = useMemo(
    () => selectedWineId ? wineIndex.get(selectedWineId) ?? null : null,
    [selectedWineId, wineIndex],
  );

  // Central click handler
  // Rule: drill navigation closes the panel (user is changing context).
  // Wine selection opens the panel. Panel stays open only for explicit wine taps.
  const handleNodeClick = useCallback((node: CellarNode) => {
    if (canDrill(node)) {
      setPathIds((prev) => [...prev, node.id]);
      setSelectedWineId(null); // close panel on drill — context is changing
    } else if (isWineNode(node)) {
      setSelectedWineId(node.id);
    }
  }, []);

  const handleNavigate = useCallback((newPathIds: string[]) => {
    setPathIds(newPathIds);
    setSelectedWineId(null); // close panel on breadcrumb navigation
  }, []);

  const handleDismissPanel = useCallback(() => {
    setSelectedWineId(null);
  }, []);

  const handleHover = useCallback((nodeId: string | null) => {
    setHoveredNodeId(nodeId);
  }, []);

  return (
    <div>
      {/* Breadcrumb row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
        flexWrap: 'wrap',
      }}>
        <Breadcrumb
          rootLabel={rootLabel}
          segments={breadcrumb}
          pathIds={resolvedPath}
          onNavigate={handleNavigate}
        />
        <ViewToggle viewMode={viewMode} onToggle={setViewMode} />
      </div>

      {/* Main view */}
      {viewMode === 'treemap' ? (
        <TreemapView
          nodes={currentChildren}
          isTerminalPath={isTerminalPath}
          hoveredNodeId={hoveredNodeId}
          onNodeClick={handleNodeClick}
          onNodeHover={handleHover}
          currentNode={currentNode}
        />
      ) : (
        <ListView
          nodes={currentChildren}
          isTerminalPath={isTerminalPath}
          onNodeClick={handleNodeClick}
        />
      )}

      {/* Wine detail panel */}
      <WineDetailPanel
        wine={selectedWine}
        onDismiss={handleDismissPanel}
      />
    </div>
  );
}
```

- [ ] **Step 2: Update `page.tsx` to use `CellarBrowser`**

In `app/s/[shareId]/page.tsx`, modify the `ActiveShareView` function. Keep the header and CTA footer. Replace the treemap hero, divider, and wine list with `CellarBrowser`.

The key changes to `ActiveShareView`:

1. Import `buildHierarchy` and `CellarBrowser`
2. Build tree from entries
3. Replace `<Treemap>` + divider + wine list sections with `<CellarBrowser>`
4. Remove the `Treemap` import and the `groupEntries`/`EntryGroup`/`WineCard` local code (now handled by CellarBrowser and shared WineCard)

Replace the `ActiveShareView` function body:

```tsx
import { buildHierarchy } from '@/lib/cellar-tree';
import { CellarBrowser } from './CellarBrowser';

// Remove these imports/locals (now unused):
// - import { Treemap } from './Treemap';
// - groupEntries function
// - EntryGroup interface
// - WineCard function (now in app/components/WineCard.tsx)
// - wineTypeStyle function (moved to WineCard)
// - geographyLine function (moved to WineCard)
// - WINE_TYPE_LABELS (moved to WineCard)

function ActiveShareView({ pack, shareId }: { pack: SharePack; shareId: string }) {
  const { snapshot, provider } = pack;
  const tree = buildHierarchy(pack.entries);
  const rootLabel = snapshot.snapshotTitle || 'Cellar';

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 20px 80px' }}>
      {/* ── Header (unchanged) ── */}
      <header style={{ marginBottom: 32 }}>
        <h1 style={{
          fontSize: '1.8rem', fontWeight: 600, letterSpacing: '-0.025em',
          lineHeight: 1.2, color: 'var(--atlas-text)', margin: 0,
        }}>
          {snapshot.snapshotTitle}
        </h1>

        {snapshot.snapshotSubtitle && (
          <p style={{ marginTop: 6, fontSize: '1rem', color: 'var(--atlas-text-secondary)', lineHeight: 1.4 }}>
            {snapshot.snapshotSubtitle}
          </p>
        )}

        <div style={{
          marginTop: 10, fontSize: '0.82rem', color: 'var(--atlas-text-placeholder)', letterSpacing: '0.01em',
        }}>
          Shared by{' '}
          <span style={{ color: 'var(--atlas-text-secondary)', fontWeight: 500 }}>
            {provider.providerDisplayName}
          </span>
          {provider.attributionLine && <> &middot; {provider.attributionLine}</>}
        </div>

        {snapshot.snapshotDescription && (
          <div style={{
            marginTop: 16, padding: '14px 16px', background: 'var(--atlas-card)',
            border: '1px solid var(--atlas-card-stroke)', borderRadius: 8,
            fontSize: '0.88rem', color: 'var(--atlas-text-secondary)', lineHeight: 1.65,
          }}>
            {snapshot.snapshotDescription}
          </div>
        )}

        <div style={{
          marginTop: 20, fontSize: '0.75rem', fontWeight: 600,
          letterSpacing: '0.08em', textTransform: 'uppercase' as const,
          color: 'var(--atlas-text-placeholder)',
        }}>
          {snapshot.itemCount} {snapshot.itemCount === 1 ? 'wine' : 'wines'}
        </div>
      </header>

      {/* ── Cellar Browser (replaces treemap hero + divider + wine list) ── */}
      {pack.entries.length > 0 && (
        <CellarBrowser tree={tree} rootLabel={rootLabel} shareId={shareId} />
      )}

      {/* ── CTAs (unchanged) ── */}
      <div style={{
        marginTop: 48, padding: '24px 20px', background: 'var(--atlas-card)',
        border: '1px solid var(--atlas-card-stroke)', borderRadius: 12,
        textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
      }}>
        <p style={{ fontSize: '0.82rem', color: 'var(--atlas-text-secondary)', margin: 0, lineHeight: 1.5 }}>
          View this cellar in vynr for the full atlas experience.
        </p>
        <a
          href={`vynr://share?id=${shareId}`}
          style={{
            display: 'inline-block', padding: '11px 28px', fontSize: '0.88rem', fontWeight: 600,
            letterSpacing: '0.01em', color: 'var(--atlas-bg)', background: 'var(--atlas-text)',
            borderRadius: 8, textDecoration: 'none', transition: 'opacity 0.15s ease',
          }}
        >
          Open in vynr
        </a>
        <a
          href="https://apps.apple.com/app/vynr/id6744048730"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: '0.8rem', color: 'var(--atlas-tint)', textDecoration: 'none',
            borderBottom: '1px solid var(--atlas-separator)', paddingBottom: '1px',
            transition: 'color 0.15s ease',
          }}
        >
          Get vynr for iOS
        </a>
      </div>

      <div style={{ marginTop: 40, textAlign: 'center', fontSize: '0.72rem', color: 'var(--atlas-text-placeholder)', letterSpacing: '0.04em' }}>
        <span style={{ opacity: 0.6 }}>Shared via vynr</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify build succeeds**

Run: `cd /Users/badday/dev/ios/vynr-app/vynr-web && npx next build 2>&1 | tail -15`

Expected: Build succeeds. If there are unused import warnings for old `Treemap` component or local `WineCard`, clean them up.

- [ ] **Step 4: Run all existing tests**

Run: `cd /Users/badday/dev/ios/vynr-app/vynr-web && npx tsx --test lib/__tests__/cellar-tree.test.ts lib/__tests__/treemap-layout.test.ts`

Expected: All PASS.

- [ ] **Step 5: Commit**

```bash
cd /Users/badday/dev/ios/vynr-app/vynr-web
git add app/s/\[shareId\]/CellarBrowser.tsx app/s/\[shareId\]/page.tsx
git commit -m "feat: CellarBrowser wired into share page — navigable treemap browser live"
```

---

### Task 10: Manual verification

- [ ] **Step 1: Start dev server**

Run: `cd /Users/badday/dev/ios/vynr-app/vynr-web && npm run dev`

- [ ] **Step 2: Test with a real shared pack**

Open `http://localhost:3000/s/{shareId}` with a known share ID. Verify:

1. Country-level treemap renders at top level
2. Click a country tile — drills into regions
3. Click a region — drills into appellations or wines
4. Click a wine tile — detail panel opens
5. Breadcrumb shows path, clicking a segment navigates up
6. View toggle switches between treemap and list
7. List shows same nodes as treemap at current level
8. Detail panel dismiss works (backdrop click, X button, Escape)

- [ ] **Step 3: Test responsive behavior**

1. Resize browser below 768px — panel becomes bottom sheet
2. Treemap adjusts aspect ratio
3. No tooltips on mobile viewport
4. Breadcrumb scrolls horizontally if path is long

- [ ] **Step 4: Test keyboard accessibility**

1. Tab through treemap tiles
2. Enter/Space activates (drills or opens detail)
3. Focus ring visible on tiles
4. Focus moves to panel on open, returns on dismiss

- [ ] **Step 5: Test state continuity**

1. Drill into a deep path (country -> region -> appellation)
2. Toggle between treemap and list — verify pathIds preserved, same nodes shown
3. Resize browser across 768px breakpoint — verify pathIds, viewMode, selectedWineId all preserved
4. Open wine panel, then click breadcrumb to navigate up — verify panel closes
5. Open wine panel, then drill into a group tile — verify panel closes
6. Open wine from list view, toggle to treemap view — verify panel stays open (view toggle is not navigation)

- [ ] **Step 6: Test edge cases**

1. Empty pack (0 entries) — no browser rendered
2. Pack with wines only in one country — single root node
3. Pack with no regions (country-only geography) — wines under country
4. Resize across 768px breakpoint while drilled deep with panel open — state preserved

---

### Task 11: Delete old `Treemap.tsx`, clean up, and push

**Gate:** Only proceed after Task 10 manual verification confirms TreemapView matches the current static hero functionality plus drill-down behavior. Do not delete before parity is verified.

**Files:**
- Delete: `app/s/[shareId]/Treemap.tsx`
- Modify: `app/s/[shareId]/page.tsx` (remove any remaining dead code)

- [ ] **Step 1: Verify the old Treemap is no longer imported**

Run: `cd /Users/badday/dev/ios/vynr-app/vynr-web && grep -r "from.*Treemap" app/s/`

Expected: No results (the import was removed in Task 9).

- [ ] **Step 2: Delete old Treemap.tsx**

Run: `cd /Users/badday/dev/ios/vynr-app/vynr-web && rm app/s/\[shareId\]/Treemap.tsx`

- [ ] **Step 3: Clean up any remaining dead code in page.tsx**

Verify `page.tsx` has no unused imports or functions. The following should be gone:
- `groupEntries` function
- `EntryGroup` interface
- Local `WineCard` function
- `wineTypeStyle` function
- `geographyLine` function
- `WINE_TYPE_LABELS` constant
- Import of `wineTypeTint`, `wineTypeColor`, `wineTypeBorder` from treemap-colors (now used by WineCard component)

Keep only: `fetchShare`, `SharePack`, `ShareEntry` from share-api, `buildHierarchy` from cellar-tree, `CellarBrowser`, `Metadata`, `notFound`.

- [ ] **Step 4: Verify build succeeds**

Run: `cd /Users/badday/dev/ios/vynr-app/vynr-web && npx next build 2>&1 | tail -10`

Expected: Build succeeds with no warnings about missing imports.

- [ ] **Step 5: Run all tests**

Run: `cd /Users/badday/dev/ios/vynr-app/vynr-web && npx tsx --test lib/__tests__/cellar-tree.test.ts lib/__tests__/treemap-layout.test.ts`

Expected: All PASS.

- [ ] **Step 6: Commit and push**

```bash
cd /Users/badday/dev/ios/vynr-app/vynr-web
git add -A app/s/\[shareId\]/
git commit -m "chore: remove old Treemap.tsx, clean up dead code in page.tsx"
git push
```

(Vercel auto-deploys from main.)
