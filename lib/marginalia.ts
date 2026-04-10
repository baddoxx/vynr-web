/**
 * Marginalia resolution for web rendering.
 *
 * Port of vynrCore MarginaliaResolver — same rules, same ordering.
 * ADR-0069 §Curator Marginalia Layer — Resolution Rules.
 *
 * Resolution rules (non-negotiable):
 * - Level precedence: exact > inherited > child summary
 * - Within each level: sorted by displayOrder ascending
 * - Cross-level interleaving forbidden
 * - Inherited: one level up only, capped at 2
 * - Children: one level down only, collapsed to count
 */

import type { MarginaliaEntry } from './share-api';
import { getAtlasNode } from './atlas';

// ─── Types ──────────────────────────────────────────────────────────────────

export type MarginaliaSection =
  | { kind: 'exact'; entry: MarginaliaEntry }
  | { kind: 'inherited'; entry: MarginaliaEntry; parentLabel: string }
  | { kind: 'childSummary'; count: number };

export interface MarginaliaResolutionPlan {
  sections: MarginaliaSection[];
}

// ─── Resolution ─────────────────────────────────────────────────────────────

const MAX_INHERITED_INLINE = 2;

/**
 * Resolve marginalia for entity `entityId`.
 *
 * @param entityId  Canonical ID of the entity being viewed (e.g., "geo:fr:burgundy")
 * @param marginalia  The full marginalia array from the snapshot
 * @param parentEntityId  Canonical ID of the entity's atlas parent, or null for root
 * @param childEntityIds  Canonical IDs of the entity's direct atlas children
 * @returns Fully resolved plan — the renderer consumes this, never raw arrays.
 */
export function resolveMarginalia(
  entityId: string,
  marginalia: MarginaliaEntry[],
  parentEntityId: string | null,
  childEntityIds: string[],
): MarginaliaResolutionPlan {
  if (marginalia.length === 0) return { sections: [] };

  const childIdSet = new Set(childEntityIds);
  const exactEntries: MarginaliaEntry[] = [];
  const inheritedEntries: MarginaliaEntry[] = [];
  let childCount = 0;

  for (const entry of marginalia) {
    const targetIds = new Set(entry.targets.map((t) => t.targetId));

    if (targetIds.has(entityId)) {
      exactEntries.push(entry);
    } else if (parentEntityId && targetIds.has(parentEntityId)) {
      inheritedEntries.push(entry);
    } else {
      for (const tid of targetIds) {
        if (childIdSet.has(tid)) {
          childCount++;
          break;
        }
      }
    }
  }

  // Build sections: exact > inherited > child summary
  // Within each level: sorted by displayOrder ascending
  const sections: MarginaliaSection[] = [];

  const sortedExact = exactEntries.sort((a, b) => a.displayOrder - b.displayOrder);
  for (const entry of sortedExact) {
    sections.push({ kind: 'exact', entry });
  }

  const sortedInherited = inheritedEntries
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .slice(0, MAX_INHERITED_INLINE);
  for (const entry of sortedInherited) {
    const parentNode = parentEntityId ? getAtlasNode(parentEntityId) : undefined;
    const parentLabel = parentNode?.displayName ?? parentEntityId ?? '';
    sections.push({ kind: 'inherited', entry, parentLabel });
  }

  if (childCount > 0) {
    sections.push({ kind: 'childSummary', count: childCount });
  }

  return { sections };
}

/**
 * Resolve parent and child IDs for an entity from the atlas.
 * Returns null parent and empty children if entity is not in the atlas.
 */
export function resolveEntityContext(entityId: string): {
  parentEntityId: string | null;
  childEntityIds: string[];
} {
  const node = getAtlasNode(entityId);
  if (!node) return { parentEntityId: null, childEntityIds: [] };
  return {
    parentEntityId: node.parentId,
    childEntityIds: node.childIds,
  };
}
