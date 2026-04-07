/**
 * Squarified treemap layout engine.
 *
 * Pure TypeScript port of the Bruls/Huizing/van Wijk (2000) algorithm
 * used in the vynr iOS app. Zero dependencies.
 *
 * Input: weighted items + bounding dimensions.
 * Output: positioned rectangles filling the bounding area.
 */

// ─── Public types ────────────────────────────────────────────────────────────

export interface TreemapItem {
  id: string;
  label: string;
  weight: number;
  wineType?: string;
  subLabel?: string;
}

export interface TreemapRect {
  item: TreemapItem;
  x: number;
  y: number;
  width: number;
  height: number;
}

// ─── Internal helpers ────────────────────────────────────────────────────────

interface Remaining {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Worst aspect ratio among items in a strip.
 *
 * For a strip laid along `sideLength` with total area `stripArea`:
 *   thickness = stripArea / sideLength
 *   each item's length = (itemArea / stripArea) * sideLength
 *   aspect = max(length/thickness, thickness/length)
 *
 * Returns the maximum aspect ratio across all items.
 */
function worstAspectRatio(
  areas: number[],
  stripArea: number,
  sideLength: number,
): number {
  if (sideLength <= 0 || stripArea <= 0) return Infinity;
  const thickness = stripArea / sideLength;
  let worst = 0;
  for (const area of areas) {
    const length = (area / stripArea) * sideLength;
    const ratio = length > thickness ? length / thickness : thickness / length;
    if (ratio > worst) worst = ratio;
  }
  return worst;
}

/**
 * Lay out one strip of items within the remaining rect.
 *
 * Returns the rectangles for this strip. The caller advances `remaining`
 * past the strip.
 */
function layoutStrip(
  stripAreas: number[],
  stripItems: TreemapItem[],
  remaining: Remaining,
  horizontal: boolean,
): TreemapRect[] {
  const totalArea = stripAreas.reduce((a, b) => a + b, 0);
  const sideLength = horizontal ? remaining.h : remaining.w;
  const thickness = sideLength > 0 ? totalArea / sideLength : 0;

  const rects: TreemapRect[] = [];
  let offset = 0;

  for (let i = 0; i < stripAreas.length; i++) {
    const itemLength =
      totalArea > 0 ? (stripAreas[i] / totalArea) * sideLength : 0;

    // Force-fill: last item extends to strip boundary
    const isLast = i === stripAreas.length - 1;
    const effectiveLength = isLast ? sideLength - offset : itemLength;

    if (horizontal) {
      rects.push({
        item: stripItems[i],
        x: remaining.x,
        y: remaining.y + offset,
        width: thickness,
        height: effectiveLength,
      });
    } else {
      rects.push({
        item: stripItems[i],
        x: remaining.x + offset,
        y: remaining.y,
        width: effectiveLength,
        height: thickness,
      });
    }

    offset += itemLength;
  }

  return rects;
}

// ─── Public API ──────────────────────────────────────────────────────────────

const DEFAULT_GAP = 2;

/**
 * Compute a squarified treemap layout.
 *
 * @param items   - Weighted items to lay out. Items with weight <= 0 are skipped.
 * @param width   - Bounding width in pixels.
 * @param height  - Bounding height in pixels.
 * @param gap     - Gap between tiles in pixels (default 2). Applied post-layout.
 * @returns Array of positioned rectangles, one per non-zero-weight item.
 */
export function squarify(
  items: TreemapItem[],
  width: number,
  height: number,
  gap: number = DEFAULT_GAP,
): TreemapRect[] {
  // Filter and sort descending by weight
  const sorted = items.filter((i) => i.weight > 0).sort((a, b) => b.weight - a.weight);
  if (sorted.length === 0 || width <= 0 || height <= 0) return [];

  const totalArea = width * height;
  const totalWeight = sorted.reduce((s, i) => s + i.weight, 0);

  // Normalize weights to areas
  const areas = sorted.map((i) => (i.weight / totalWeight) * totalArea);

  const allRects: TreemapRect[] = [];
  const remaining: Remaining = { x: 0, y: 0, w: width, h: height };

  let idx = 0;
  while (idx < sorted.length) {
    const horizontal = remaining.w >= remaining.h;
    const sideLength = horizontal ? remaining.h : remaining.w;

    // Build strip greedily
    const stripAreas: number[] = [areas[idx]];
    const stripItems: TreemapItem[] = [sorted[idx]];
    let stripTotal = areas[idx];

    let bestWorst = worstAspectRatio(stripAreas, stripTotal, sideLength);

    let next = idx + 1;
    while (next < sorted.length) {
      const candidateAreas = [...stripAreas, areas[next]];
      const candidateTotal = stripTotal + areas[next];
      const candidateWorst = worstAspectRatio(
        candidateAreas,
        candidateTotal,
        sideLength,
      );

      if (candidateWorst > bestWorst) {
        // Adding this item makes aspect ratios worse — stop
        break;
      }

      stripAreas.push(areas[next]);
      stripItems.push(sorted[next]);
      stripTotal = candidateTotal;
      bestWorst = candidateWorst;
      next++;
    }

    // Force-fill: if this is the last strip, extend to container boundary
    const isLastStrip = next >= sorted.length;

    const rects = layoutStrip(stripAreas, stripItems, remaining, horizontal);

    // Advance remaining rect past this strip
    if (rects.length > 0) {
      if (horizontal) {
        const stripThickness = isLastStrip
          ? remaining.w
          : stripTotal / sideLength;
        // Adjust rects for force-fill on last strip
        if (isLastStrip) {
          for (const r of rects) {
            r.width = remaining.w;
          }
        }
        remaining.x += stripThickness;
        remaining.w -= stripThickness;
      } else {
        const stripThickness = isLastStrip
          ? remaining.h
          : stripTotal / sideLength;
        if (isLastStrip) {
          for (const r of rects) {
            r.height = remaining.h;
          }
        }
        remaining.y += stripThickness;
        remaining.h -= stripThickness;
      }
    }

    allRects.push(...rects);
    idx = next;
  }

  // Apply gap inset post-layout
  if (gap > 0) {
    const half = gap / 2;
    for (const r of allRects) {
      r.x += half;
      r.y += half;
      r.width = Math.max(0, r.width - gap);
      r.height = Math.max(0, r.height - gap);
    }
  }

  return allRects;
}
