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
      {/* View toggle — top right */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        marginBottom: 8,
      }}>
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

      {/* Wine detail panel */}
      <WineDetailPanel
        wine={selectedWine}
        onDismiss={handleDismissPanel}
      />
    </div>
  );
}
