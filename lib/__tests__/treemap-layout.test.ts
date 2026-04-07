import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { squarify, type TreemapItem } from '../treemap-layout';
import { dominantWineType } from '../treemap-colors';

describe('squarify', () => {

  it('returns empty array for empty items', () => {
    const result = squarify([], 600, 400);
    assert.equal(result.length, 0);
  });

  it('single item fills the container minus gap', () => {
    const items: TreemapItem[] = [{ id: 'a', label: 'A', weight: 10 }];
    const result = squarify(items, 600, 400, 2);
    assert.equal(result.length, 1);
    // Should fill most of the container (minus gap inset)
    assert.ok(result[0].width > 590);
    assert.ok(result[0].height > 390);
  });

  it('two equal items split the container', () => {
    const items: TreemapItem[] = [
      { id: 'a', label: 'A', weight: 1 },
      { id: 'b', label: 'B', weight: 1 },
    ];
    const result = squarify(items, 600, 400, 0); // no gap for easier assertion
    assert.equal(result.length, 2);
    // Total area should approximately equal container area
    const totalArea = result.reduce((sum, r) => sum + r.width * r.height, 0);
    assert.ok(Math.abs(totalArea - 600 * 400) < 1, `Area conservation: ${totalArea}`);
    // Both should have roughly equal areas
    const area0 = result[0].width * result[0].height;
    const area1 = result[1].width * result[1].height;
    assert.ok(Math.abs(area0 - area1) < 1, `Equal areas: ${area0} vs ${area1}`);
  });

  it('weighted items have proportional areas', () => {
    const items: TreemapItem[] = [
      { id: 'big', label: 'Big', weight: 3 },
      { id: 'small', label: 'Small', weight: 1 },
    ];
    const result = squarify(items, 600, 400, 0);
    const areaBig = result.find(r => r.item.id === 'big')!;
    const areaSmall = result.find(r => r.item.id === 'small')!;
    const ratioBig = (areaBig.width * areaBig.height) / (600 * 400);
    const ratioSmall = (areaSmall.width * areaSmall.height) / (600 * 400);
    // Big should be ~75%, small ~25%
    assert.ok(ratioBig > 0.7 && ratioBig < 0.8, `Big ratio: ${ratioBig}`);
    assert.ok(ratioSmall > 0.2 && ratioSmall < 0.3, `Small ratio: ${ratioSmall}`);
  });

  it('all rects are within bounds', () => {
    const items: TreemapItem[] = Array.from({ length: 10 }, (_, i) => ({
      id: `item-${i}`,
      label: `Item ${i}`,
      weight: (i + 1) * 3.7, // deterministic, varied weights
    }));
    const result = squarify(items, 600, 400, 2);
    for (const r of result) {
      assert.ok(r.x >= 0, `x >= 0: ${r.x}`);
      assert.ok(r.y >= 0, `y >= 0: ${r.y}`);
      assert.ok(r.x + r.width <= 601, `right edge <= 601: ${r.x + r.width}`);
      assert.ok(r.y + r.height <= 401, `bottom edge <= 401: ${r.y + r.height}`);
      assert.ok(r.width > 0, `width > 0: ${r.width}`);
      assert.ok(r.height > 0, `height > 0: ${r.height}`);
    }
  });

  it('no rects overlap (gap > 0)', () => {
    const items: TreemapItem[] = Array.from({ length: 5 }, (_, i) => ({
      id: `item-${i}`,
      label: `Item ${i}`,
      weight: i + 1,
    }));
    const result = squarify(items, 600, 400, 2);
    // Check pairwise that no rects overlap
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const a = result[i];
        const b = result[j];
        const overlap = !(
          a.x + a.width <= b.x ||
          b.x + b.width <= a.x ||
          a.y + a.height <= b.y ||
          b.y + b.height <= a.y
        );
        assert.ok(!overlap, `Rects ${i} and ${j} overlap`);
      }
    }
  });

  it('handles zero-weight items gracefully', () => {
    const items: TreemapItem[] = [
      { id: 'a', label: 'A', weight: 0 },
      { id: 'b', label: 'B', weight: 1 },
    ];
    // Should not throw — zero-weight items are filtered out
    const result = squarify(items, 600, 400);
    assert.ok(result.length > 0);
    // Zero-weight item should be excluded
    assert.equal(result.length, 1);
    assert.equal(result[0].item.id, 'b');
  });

  it('handles very small container', () => {
    const items: TreemapItem[] = [
      { id: 'a', label: 'A', weight: 1 },
      { id: 'b', label: 'B', weight: 1 },
    ];
    const result = squarify(items, 10, 10, 1);
    assert.equal(result.length, 2);
  });

  it('many items produce reasonable aspect ratios', () => {
    const items: TreemapItem[] = Array.from({ length: 20 }, (_, i) => ({
      id: `item-${i}`,
      label: `Item ${i}`,
      weight: (i + 1) * 5 + ((i * 17) % 13), // deterministic, varied
    }));
    const result = squarify(items, 600, 400, 2);
    // Check that aspect ratios are reasonable (< 10:1)
    for (const r of result) {
      const ratio = Math.max(r.width / r.height, r.height / r.width);
      assert.ok(ratio < 10, `Aspect ratio too extreme: ${ratio} for ${r.item.id}`);
    }
  });

  it('area conservation holds with gap', () => {
    const items: TreemapItem[] = [
      { id: 'a', label: 'A', weight: 5 },
      { id: 'b', label: 'B', weight: 3 },
      { id: 'c', label: 'C', weight: 2 },
    ];
    const gap = 2;
    const result = squarify(items, 600, 400, gap);
    const totalArea = result.reduce((sum, r) => sum + r.width * r.height, 0);
    const containerArea = 600 * 400;
    // With gap inset, total tile area should be less than container area
    assert.ok(totalArea < containerArea, 'Tiles should not exceed container');
    assert.ok(totalArea > containerArea * 0.9, `Tiles too small: ${totalArea} vs ${containerArea}`);
  });

  it('result count matches non-zero-weight input count', () => {
    const items: TreemapItem[] = [
      { id: 'a', label: 'A', weight: 5 },
      { id: 'b', label: 'B', weight: 3 },
      { id: 'c', label: 'C', weight: 0 }, // excluded
      { id: 'd', label: 'D', weight: 2 },
    ];
    const result = squarify(items, 600, 400);
    assert.equal(result.length, 3);
    const ids = result.map(r => r.item.id);
    assert.ok(ids.includes('a'));
    assert.ok(ids.includes('b'));
    assert.ok(ids.includes('d'));
    assert.ok(!ids.includes('c'));
  });

  it('returns empty for zero-dimension container', () => {
    const items: TreemapItem[] = [{ id: 'a', label: 'A', weight: 1 }];
    assert.equal(squarify(items, 0, 400).length, 0);
    assert.equal(squarify(items, 600, 0).length, 0);
    assert.equal(squarify(items, 0, 0).length, 0);
  });

  it('single-item rect origin is at gap/2', () => {
    const items: TreemapItem[] = [{ id: 'a', label: 'A', weight: 1 }];
    const gap = 4;
    const result = squarify(items, 600, 400, gap);
    assert.equal(result.length, 1);
    assert.equal(result[0].x, gap / 2);
    assert.equal(result[0].y, gap / 2);
    assert.equal(result[0].width, 600 - gap);
    assert.equal(result[0].height, 400 - gap);
  });
});

describe('dominantWineType', () => {
  it('returns the most frequent type', () => {
    assert.equal(dominantWineType(['red', 'red', 'white']), 'red');
  });
  it('returns undefined for even split across 3+ types', () => {
    assert.equal(dominantWineType(['red', 'white', 'rosé']), undefined);
  });
  it('returns undefined for even split across 2 types', () => {
    assert.equal(dominantWineType(['red', 'white']), undefined);
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
