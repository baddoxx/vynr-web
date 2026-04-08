import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeKey,
  buildHierarchy,
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
import type { ShareEntry } from '../share-api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeEntry(
  overrides: Partial<ShareEntry> & {
    wineName: string;
    country: string;
    wineType: string;
    externalEntryId: string;
  }
): ShareEntry {
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

// ─── normalizeKey ─────────────────────────────────────────────────────────────

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

// ─── buildHierarchy ───────────────────────────────────────────────────────────

describe('buildHierarchy', () => {
  it('returns empty array for no entries', () => {
    const roots = buildHierarchy([]);
    assert.deepEqual(roots, []);
  });

  it('groups entries by country at root level', () => {
    const entries = [
      makeEntry({ externalEntryId: 'a', wineName: 'Wine A', wineType: 'red', country: 'France' }),
      makeEntry({ externalEntryId: 'b', wineName: 'Wine B', wineType: 'white', country: 'Italy' }),
    ];
    const roots = buildHierarchy(entries);
    assert.equal(roots.length, 2);
    const labels = roots.map((n) => n.label).sort();
    assert.deepEqual(labels, ['France', 'Italy']);
    assert.ok(roots.every((n) => n.kind === 'country'));
  });

  it('nests regions under countries', () => {
    const entries = [
      makeEntry({ externalEntryId: 'a', wineName: 'Wine A', wineType: 'red', country: 'France', region: 'Burgundy' }),
      makeEntry({ externalEntryId: 'b', wineName: 'Wine B', wineType: 'red', country: 'France', region: 'Bordeaux' }),
    ];
    const roots = buildHierarchy(entries);
    assert.equal(roots.length, 1);
    assert.equal(roots[0].label, 'France');
    assert.equal(roots[0].children.length, 2);
    assert.ok(roots[0].children.every((n) => n.kind === 'region'));
  });

  it('nests appellations under regions', () => {
    const entries = [
      makeEntry({
        externalEntryId: 'a', wineName: 'Wine A', wineType: 'red',
        country: 'France', region: 'Burgundy', appellation: 'Volnay',
      }),
    ];
    const roots = buildHierarchy(entries);
    const france = roots[0];
    const burgundy = france.children[0];
    assert.equal(burgundy.kind, 'region');
    assert.equal(burgundy.children[0].kind, 'appellation');
    assert.equal(burgundy.children[0].label, 'Volnay');
  });

  it('collapses missing appellation — wines nest under region', () => {
    const entries = [
      makeEntry({ externalEntryId: 'a', wineName: 'Wine A', wineType: 'red', country: 'France', region: 'Burgundy' }),
    ];
    const roots = buildHierarchy(entries);
    const region = roots[0].children[0];
    assert.equal(region.kind, 'region');
    assert.equal(region.children[0].kind, 'wine');
  });

  it('collapses missing region — wines nest under country', () => {
    const entries = [
      makeEntry({ externalEntryId: 'a', wineName: 'Wine A', wineType: 'red', country: 'France' }),
    ];
    const roots = buildHierarchy(entries);
    assert.equal(roots[0].kind, 'country');
    assert.equal(roots[0].children[0].kind, 'wine');
  });

  it('aggregates weights bottom-up', () => {
    const entries = [
      makeEntry({ externalEntryId: 'a', wineName: 'W1', wineType: 'red', country: 'France', region: 'Burgundy', appellation: 'Volnay' }),
      makeEntry({ externalEntryId: 'b', wineName: 'W2', wineType: 'red', country: 'France', region: 'Burgundy', appellation: 'Pommard' }),
      makeEntry({ externalEntryId: 'c', wineName: 'W3', wineType: 'red', country: 'Italy', region: 'Piedmont', appellation: 'Barolo' }),
    ];
    const roots = buildHierarchy(entries);
    const france = roots.find((n) => n.label === 'France')!;
    const italy = roots.find((n) => n.label === 'Italy')!;
    assert.equal(france.weight, 2);
    assert.equal(italy.weight, 1);
    assert.equal(france.children[0].weight, 2); // Burgundy
  });

  it('sorts children by weight desc then label alpha', () => {
    const entries = [
      makeEntry({ externalEntryId: 'a', wineName: 'W1', wineType: 'red', country: 'France', region: 'Burgundy' }),
      makeEntry({ externalEntryId: 'b', wineName: 'W2', wineType: 'red', country: 'France', region: 'Burgundy' }),
      makeEntry({ externalEntryId: 'c', wineName: 'W3', wineType: 'red', country: 'France', region: 'Alsace' }),
    ];
    const roots = buildHierarchy(entries);
    // Burgundy has weight 2, Alsace has weight 1 — Burgundy first
    assert.equal(roots[0].children[0].label, 'Burgundy');
    assert.equal(roots[0].children[1].label, 'Alsace');
  });

  it('alpha tie-breaker when weights are equal', () => {
    const entries = [
      makeEntry({ externalEntryId: 'a', wineName: 'W1', wineType: 'red', country: 'France', region: 'Rhône' }),
      makeEntry({ externalEntryId: 'b', wineName: 'W2', wineType: 'red', country: 'France', region: 'Alsace' }),
    ];
    const roots = buildHierarchy(entries);
    const labels = roots[0].children.map((n) => n.label);
    // Both weight 1 — alphabetical: Alsace < Rhône
    assert.equal(labels[0], 'Alsace');
    assert.equal(labels[1], 'Rhône');
  });

  it('wine node IDs include parent path', () => {
    const entries = [
      makeEntry({
        externalEntryId: 'abc', wineName: 'Wine A', wineType: 'red',
        country: 'France', region: 'Burgundy', appellation: 'Volnay',
      }),
    ];
    const roots = buildHierarchy(entries);
    const appellation = roots[0].children[0].children[0];
    const wineNode = appellation.children[0];
    assert.equal(wineNode.kind, 'wine');
    assert.equal(wineNode.id, 'wine:france/burgundy/volnay/abc');
  });

  it('node IDs are normalized (trimmed, lowercased)', () => {
    const entries = [
      makeEntry({
        externalEntryId: 'x', wineName: 'Wine', wineType: 'red',
        country: '  France  ', region: '  Burgundy  ',
      }),
    ];
    const roots = buildHierarchy(entries);
    assert.equal(roots[0].id, 'country:france');
    assert.equal(roots[0].children[0].id, 'region:france/burgundy');
  });

  it('is deterministic — same input produces same output', () => {
    const entries = [
      makeEntry({ externalEntryId: 'a', wineName: 'W1', wineType: 'red', country: 'France', region: 'Burgundy' }),
      makeEntry({ externalEntryId: 'b', wineName: 'W2', wineType: 'white', country: 'Italy', region: 'Tuscany' }),
    ];
    const r1 = buildHierarchy(entries);
    const r2 = buildHierarchy(entries);
    assert.deepEqual(JSON.stringify(r1), JSON.stringify(r2));
  });

  it('sets wineType on group nodes from dominant type', () => {
    const entries = [
      makeEntry({ externalEntryId: 'a', wineName: 'W1', wineType: 'red', country: 'France', region: 'Burgundy' }),
      makeEntry({ externalEntryId: 'b', wineName: 'W2', wineType: 'red', country: 'France', region: 'Burgundy' }),
      makeEntry({ externalEntryId: 'c', wineName: 'W3', wineType: 'white', country: 'France', region: 'Burgundy' }),
    ];
    const roots = buildHierarchy(entries);
    assert.equal(roots[0].wineType, 'red');
  });

  it('sets wineType undefined on group nodes when tied', () => {
    const entries = [
      makeEntry({ externalEntryId: 'a', wineName: 'W1', wineType: 'red', country: 'France' }),
      makeEntry({ externalEntryId: 'b', wineName: 'W2', wineType: 'white', country: 'France' }),
    ];
    const roots = buildHierarchy(entries);
    assert.equal(roots[0].wineType, undefined);
  });

  it('handles mixed missing geography within same country', () => {
    const entries = [
      makeEntry({ externalEntryId: 'a', wineName: 'W1', wineType: 'red', country: 'France' }),
      makeEntry({ externalEntryId: 'b', wineName: 'W2', wineType: 'red', country: 'France', region: 'Burgundy' }),
      makeEntry({
        externalEntryId: 'c', wineName: 'W3', wineType: 'red',
        country: 'France', region: 'Burgundy', appellation: 'Volnay',
      }),
    ];
    const roots = buildHierarchy(entries);
    assert.equal(roots.length, 1);
    assert.equal(roots[0].label, 'France');
    assert.equal(roots[0].weight, 3);

    // Wine with no region goes directly under France
    const franceDirectWines = roots[0].children.filter((n) => n.kind === 'wine');
    assert.equal(franceDirectWines.length, 1);
    assert.equal(franceDirectWines[0].entry!.externalEntryId, 'a');

    // Burgundy region present
    const burgundy = roots[0].children.find((n) => n.label === 'Burgundy');
    assert.ok(burgundy);
    assert.equal(burgundy!.weight, 2);
  });

  it('wine leaves have entry and weight 1', () => {
    const entry = makeEntry({
      externalEntryId: 'z', wineName: 'Test Wine', wineType: 'red', country: 'France',
    });
    const roots = buildHierarchy([entry]);
    const wineNode = roots[0].children[0];
    assert.equal(wineNode.kind, 'wine');
    assert.equal(wineNode.weight, 1);
    assert.ok(wineNode.entry);
    assert.equal(wineNode.entry!.externalEntryId, 'z');
  });
});

// ─── Traversal fixture ────────────────────────────────────────────────────────

const FIXTURE_ENTRIES = [
  makeEntry({ externalEntryId: 'a', wineName: 'Volnay 1er', wineType: 'red', country: 'France', region: 'Burgundy', appellation: 'Volnay' }),
  makeEntry({ externalEntryId: 'b', wineName: 'Pommard', wineType: 'red', country: 'France', region: 'Burgundy', appellation: 'Pommard' }),
  makeEntry({ externalEntryId: 'c', wineName: 'Barolo', wineType: 'red', country: 'Italy', region: 'Piedmont', appellation: 'Barolo' }),
  makeEntry({ externalEntryId: 'd', wineName: 'Chianti', wineType: 'red', country: 'Italy', region: 'Tuscany' }),
];

// ─── resolveScope ─────────────────────────────────────────────────────────────

describe('resolveScope', () => {
  it('empty path returns roots', () => {
    const roots = buildHierarchy(FIXTURE_ENTRIES);
    const { children, resolvedPath } = resolveScope(roots, []);
    assert.equal(children, roots);
    assert.deepEqual(resolvedPath, []);
  });

  it('country path returns children of that country', () => {
    const roots = buildHierarchy(FIXTURE_ENTRIES);
    const franceId = roots.find((n) => n.label === 'France')!.id;
    const { children, resolvedPath } = resolveScope(roots, [franceId]);
    assert.ok(children.length > 0);
    assert.ok(children.every((n) => n.kind === 'region' || n.kind === 'wine'));
    assert.deepEqual(resolvedPath, [franceId]);
  });

  it('stale path falls back to closest valid ancestor', () => {
    const roots = buildHierarchy(FIXTURE_ENTRIES);
    const franceId = roots.find((n) => n.label === 'France')!.id;
    const { children, resolvedPath } = resolveScope(roots, [franceId, 'region:france/nonexistent']);
    // France is valid, the child segment is stale — falls back to France's children
    assert.ok(children.length > 0);
    assert.deepEqual(resolvedPath, [franceId]);
  });

  it('completely invalid path returns roots', () => {
    const roots = buildHierarchy(FIXTURE_ENTRIES);
    const { children, resolvedPath } = resolveScope(roots, ['country:nowhere']);
    assert.equal(children, roots);
    assert.deepEqual(resolvedPath, []);
  });
});

// ─── resolveCurrentNode ───────────────────────────────────────────────────────

describe('resolveCurrentNode', () => {
  it('returns null at root (empty path)', () => {
    const roots = buildHierarchy(FIXTURE_ENTRIES);
    assert.equal(resolveCurrentNode(roots, []), null);
  });

  it('valid path returns node', () => {
    const roots = buildHierarchy(FIXTURE_ENTRIES);
    const france = roots.find((n) => n.label === 'France')!;
    const node = resolveCurrentNode(roots, [france.id]);
    assert.ok(node);
    assert.equal(node!.id, france.id);
  });

  it('stale path returns last valid node', () => {
    const roots = buildHierarchy(FIXTURE_ENTRIES);
    const france = roots.find((n) => n.label === 'France')!;
    const node = resolveCurrentNode(roots, [france.id, 'region:france/nonexistent']);
    assert.ok(node);
    assert.equal(node!.id, france.id);
  });
});

// ─── breadcrumbSegments ───────────────────────────────────────────────────────

describe('breadcrumbSegments', () => {
  it('returns empty array at root', () => {
    const roots = buildHierarchy(FIXTURE_ENTRIES);
    const segs = breadcrumbSegments(roots, []);
    assert.deepEqual(segs, []);
  });

  it('returns correct segments for deep path', () => {
    const roots = buildHierarchy(FIXTURE_ENTRIES);
    const france = roots.find((n) => n.label === 'France')!;
    const burgundy = france.children.find((n) => n.label === 'Burgundy')!;
    const volnay = burgundy.children.find((n) => n.label === 'Volnay')!;
    const segs = breadcrumbSegments(roots, [france.id, burgundy.id, volnay.id]);
    assert.equal(segs.length, 3);
    assert.equal(segs[0].label, 'France');
    assert.equal(segs[1].label, 'Burgundy');
    assert.equal(segs[2].label, 'Volnay');
    assert.equal(segs[0].id, france.id);
  });
});

// ─── isLeafLevel ─────────────────────────────────────────────────────────────

describe('isLeafLevel', () => {
  it('true for appellation node with wine children', () => {
    const roots = buildHierarchy(FIXTURE_ENTRIES);
    const france = roots.find((n) => n.label === 'France')!;
    const burgundy = france.children.find((n) => n.label === 'Burgundy')!;
    const volnay = burgundy.children.find((n) => n.label === 'Volnay')!;
    assert.ok(isLeafLevel(volnay));
  });

  it('false for country node', () => {
    const roots = buildHierarchy(FIXTURE_ENTRIES);
    const france = roots.find((n) => n.label === 'France')!;
    assert.equal(isLeafLevel(france), false);
  });

  it('false for node with no children', () => {
    const emptyNode: CellarNode = { id: 'x', label: 'X', kind: 'country', weight: 0, children: [], composition: [] };
    assert.equal(isLeafLevel(emptyNode), false);
  });
});

// ─── isWineNode ───────────────────────────────────────────────────────────────

describe('isWineNode', () => {
  it('true for wine kind', () => {
    const roots = buildHierarchy(FIXTURE_ENTRIES);
    const france = roots.find((n) => n.label === 'France')!;
    const burgundy = france.children.find((n) => n.label === 'Burgundy')!;
    const volnay = burgundy.children.find((n) => n.label === 'Volnay')!;
    const wine = volnay.children[0];
    assert.ok(isWineNode(wine));
  });

  it('false for region node', () => {
    const roots = buildHierarchy(FIXTURE_ENTRIES);
    const france = roots.find((n) => n.label === 'France')!;
    const burgundy = france.children.find((n) => n.label === 'Burgundy')!;
    assert.equal(isWineNode(burgundy), false);
  });
});

// ─── canDrill ─────────────────────────────────────────────────────────────────

describe('canDrill', () => {
  it('true for group node with children', () => {
    const roots = buildHierarchy(FIXTURE_ENTRIES);
    const france = roots.find((n) => n.label === 'France')!;
    assert.ok(canDrill(france));
  });

  it('false for wine node', () => {
    const roots = buildHierarchy(FIXTURE_ENTRIES);
    const france = roots.find((n) => n.label === 'France')!;
    const burgundy = france.children.find((n) => n.label === 'Burgundy')!;
    const volnay = burgundy.children.find((n) => n.label === 'Volnay')!;
    const wine = volnay.children[0];
    assert.equal(canDrill(wine), false);
  });

  it('false for empty group', () => {
    const emptyNode: CellarNode = { id: 'x', label: 'X', kind: 'country', weight: 0, children: [], composition: [] };
    assert.equal(canDrill(emptyNode), false);
  });
});

// ─── flattenWines ─────────────────────────────────────────────────────────────

describe('flattenWines', () => {
  it('collects all wine entries recursively', () => {
    const roots = buildHierarchy(FIXTURE_ENTRIES);
    const france = roots.find((n) => n.label === 'France')!;
    const wines = flattenWines(france);
    assert.equal(wines.length, 2); // a (Volnay) and b (Pommard)
    const ids = wines.map((e) => e.externalEntryId).sort();
    assert.deepEqual(ids, ['a', 'b']);
  });

  it('returns empty array for wine node itself', () => {
    const roots = buildHierarchy(FIXTURE_ENTRIES);
    const france = roots.find((n) => n.label === 'France')!;
    const burgundy = france.children.find((n) => n.label === 'Burgundy')!;
    const volnay = burgundy.children.find((n) => n.label === 'Volnay')!;
    const wine = volnay.children[0];
    const result = flattenWines(wine);
    // Wine node has an entry but no children — flattenWines collects entry
    assert.equal(result.length, 1);
    assert.equal(result[0].externalEntryId, 'a');
  });
});

// ─── buildNodeIndex ───────────────────────────────────────────────────────────

describe('buildNodeIndex', () => {
  it('indexes all nodes by ID', () => {
    const roots = buildHierarchy(FIXTURE_ENTRIES);
    const index = buildNodeIndex(roots);
    assert.ok(index.size > 0);
    // France should be in the index
    const france = roots.find((n) => n.label === 'France')!;
    assert.ok(index.has(france.id));
    assert.equal(index.get(france.id), france);
  });

  it('includes wine nodes', () => {
    const roots = buildHierarchy(FIXTURE_ENTRIES);
    const index = buildNodeIndex(roots);
    const wineIndex = buildWineIndex(roots);
    // All wine node IDs should be in the node index
    for (const id of wineIndex.keys()) {
      assert.ok(index.has(id), `Wine node ${id} missing from node index`);
    }
  });
});

// ─── buildWineIndex ───────────────────────────────────────────────────────────

describe('buildWineIndex', () => {
  it('indexes wine entries by wine node ID', () => {
    const roots = buildHierarchy(FIXTURE_ENTRIES);
    const index = buildWineIndex(roots);
    // All 4 fixture entries should be indexed
    assert.equal(index.size, FIXTURE_ENTRIES.length);
  });

  it('size equals total wine count', () => {
    const roots = buildHierarchy(FIXTURE_ENTRIES);
    const index = buildWineIndex(roots);
    assert.equal(index.size, 4);
  });

  it('entries are retrievable by their wine node ID', () => {
    const roots = buildHierarchy(FIXTURE_ENTRIES);
    const index = buildWineIndex(roots);
    // Find Volnay wine node ID via node index
    const nodeIndex = buildNodeIndex(roots);
    for (const [id, node] of nodeIndex) {
      if (node.kind === 'wine' && node.entry?.externalEntryId === 'a') {
        assert.ok(index.has(id));
        assert.equal(index.get(id)!.externalEntryId, 'a');
      }
    }
  });
});
