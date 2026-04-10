'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import type { ShareEntry } from '@/lib/share-api';
import {
  type CellarNode,
  resolveScope,
  resolveCurrentNode,
  breadcrumbSegments,
  isWineNode,
  isLeafLevel,
  canDrill,
  buildNodeIndex,
  buildWineIndex,
} from '@/lib/cellar-tree';
import { getEducation } from '@/lib/education';
import type { MarginaliaEntry } from '@/lib/share-api';
import { resolveMarginalia, resolveEntityContext, type MarginaliaSection } from '@/lib/marginalia';
import { grapePillTint } from '@/lib/grape-colors';
import { Breadcrumb } from '@/app/components/Breadcrumb';
import { ViewToggle } from './ViewToggle';
import { TreemapView } from './TreemapView';
import { ListView } from './ListView';
import { WineDetailPanel } from './WineDetailPanel';

interface CellarBrowserProps {
  tree: CellarNode[];
  rootLabel: string;
  shareId: string;
  marginalia: MarginaliaEntry[];
  curatorName: string;
  accentColor?: string;
}

export function CellarBrowser({ tree, rootLabel, shareId, marginalia, curatorName, accentColor }: CellarBrowserProps) {
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

  // Education content for the current navigation node (atlas-backed nodes use atlas IDs)
  const education = useMemo(
    () => currentNode ? getEducation(currentNode.id) : undefined,
    [currentNode],
  );

  // Marginalia resolution for the current node (ADR-0069 §Resolution Rules)
  const marginaliaplan = useMemo(() => {
    if (!currentNode || marginalia.length === 0) return { sections: [] };
    const { parentEntityId, childEntityIds } = resolveEntityContext(currentNode.id);
    return resolveMarginalia(currentNode.id, marginalia, parentEntityId, childEntityIds);
  }, [currentNode, marginalia]);

  const isTerminalPath = useMemo(
    () => currentChildren.length > 0 && currentChildren.every(isWineNode),
    [currentChildren],
  );

  // Detect when treemap adds no proportional information:
  // all children are leaf-level (their children are all wines) and each has weight 1.
  // A treemap of equal-sized single-wine nodes is just a meaningless grid of names.
  const shouldAutoList = useMemo(
    () => !isTerminalPath &&
      currentChildren.length > 0 &&
      currentChildren.every(n => isLeafLevel(n) && n.weight === 1),
    [currentChildren, isTerminalPath],
  );

  const selectedWine = useMemo(
    () => selectedWineId ? wineIndex.get(selectedWineId) ?? null : null,
    [selectedWineId, wineIndex],
  );

  // Central click handler
  // Rule: drill navigation closes the panel (user is changing context).
  // Wine selection opens the panel. Panel stays open only for explicit wine taps.
  //
  // Leaf-level optimization (matching app behavior):
  // - If drilling into a node with exactly 1 wine child, open the wine detail directly
  // - If drilling into a node where all children are wines, drill but auto-switch to list view
  //   (a treemap of single-wine tiles is not useful)
  const handleNodeClick = useCallback((node: CellarNode) => {
    if (canDrill(node)) {
      const allChildrenAreWines = node.children.length > 0 && node.children.every(isWineNode);

      if (allChildrenAreWines && node.children.length === 1 && node.children[0].entry) {
        // Single wine — open detail directly, no need to drill
        setPathIds((prev) => [...prev, node.id]);
        setSelectedWineId(node.children[0].id);
      } else if (allChildrenAreWines) {
        // Multiple wines — drill and show as list (treemap of single-wine tiles is wasteful)
        setPathIds((prev) => [...prev, node.id]);
        setViewMode('list');
        setSelectedWineId(null);
      } else {
        setPathIds((prev) => [...prev, node.id]);
        setSelectedWineId(null);
      }
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
      {/* View toggle — top right */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        marginBottom: 8,
      }}>
        <ViewToggle viewMode={viewMode} onToggle={setViewMode} />
      </div>

      {/* Main view — auto-list when treemap adds no proportional value */}
      {viewMode === 'treemap' && !shouldAutoList && !isTerminalPath ? (
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
          shareId={shareId}
          onNodeClick={handleNodeClick}
        />
      )}

      {/* Breadcrumb — below treemap, matching app's Atlas Location Bar position */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginTop: 10,
        flexWrap: 'wrap',
      }}>
        <Breadcrumb
          rootLabel={rootLabel}
          segments={breadcrumb}
          pathIds={resolvedPath}
          onNavigate={handleNavigate}
        />
      </div>

      {/* Curator marginalia + education panel for current geography node */}
      {(marginaliaplan.sections.length > 0 || education) && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>

          {/* Exact + inherited marginalia — before education (ADR-0069 §Positioning Rules) */}
          {marginaliaplan.sections
            .filter((s): s is Extract<MarginaliaSection, { kind: 'exact' | 'inherited' }> =>
              s.kind === 'exact' || s.kind === 'inherited')
            .map((section, i) => (
              <div
                key={`m-${i}`}
                style={{
                  padding: '12px 16px',
                  background: 'var(--atlas-card)',
                  border: `1px dashed ${section.kind === 'exact'
                    ? (accentColor ? accentColor + '4D' : 'rgba(59, 130, 246, 0.3)')
                    : 'var(--atlas-separator)'}`,
                  borderRadius: 8,
                  opacity: section.kind === 'inherited' ? 0.85 : 1,
                }}
              >
                {/* Attribution: accent dot + curator name */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6,
                }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: accentColor || '#3b82f6',
                    display: 'inline-block', flexShrink: 0,
                  }} />
                  <span style={{
                    fontSize: '0.72rem', color: 'var(--atlas-text-placeholder)',
                  }}>
                    {curatorName}
                    {section.kind === 'inherited' && (
                      <> on {section.parentLabel}</>
                    )}
                  </span>
                </div>
                {/* Note content */}
                <p style={{
                  fontSize: '0.85rem',
                  color: section.kind === 'exact' ? 'var(--atlas-text)' : 'var(--atlas-text-secondary)',
                  lineHeight: 1.6,
                  margin: 0,
                }}>
                  {section.entry.content}
                </p>
              </div>
            ))}

          {/* Canonical education content */}
          {education && (
            <div style={{
              background: 'var(--atlas-card)',
              border: '1px solid var(--atlas-card-stroke)',
              borderRadius: 10,
              padding: '14px 18px',
            }}>
              <p style={{
                fontSize: '0.85rem',
                color: 'var(--atlas-text-secondary)',
                lineHeight: 1.65,
                margin: 0,
              }}>
                {education.description}
              </p>
              {education.keyGrapes.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
                  {education.keyGrapes.map((grape) => {
                    const tint = grapePillTint(grape);
                    return (
                      <span
                        key={grape}
                        style={{
                          display: 'inline-block',
                          fontSize: '0.68rem',
                          fontWeight: 500,
                          letterSpacing: '0.03em',
                          padding: '2px 8px',
                          borderRadius: 20,
                          background: tint.fill,
                          color: tint.text,
                          border: `1px solid ${tint.border}`,
                        }}
                      >
                        {grape}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Child summary — after education + key grapes (ADR-0069 §Positioning Rules) */}
          {marginaliaplan.sections
            .filter((s): s is Extract<MarginaliaSection, { kind: 'childSummary' }> =>
              s.kind === 'childSummary')
            .map((section, i) => (
              <div
                key={`mc-${i}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 0',
                }}
              >
                <span style={{
                  fontSize: '0.75rem', color: 'var(--atlas-text-placeholder)',
                }}>
                  {section.count} note{section.count === 1 ? '' : 's'} in subregions
                </span>
              </div>
            ))}

        </div>
      )}

      {/* Wine detail panel */}
      <WineDetailPanel
        wine={selectedWine}
        shareId={shareId}
        onDismiss={handleDismissPanel}
      />
    </div>
  );
}
