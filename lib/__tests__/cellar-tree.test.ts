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
