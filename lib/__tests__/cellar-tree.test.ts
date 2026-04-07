import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeKey, buildHierarchy, type CellarNode } from '../cellar-tree';
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
