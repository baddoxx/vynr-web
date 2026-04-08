'use client';

import { useState, useMemo, useCallback } from 'react';
import { resolveUrlPath, getAtlasChildren, getAtlasNode, type AtlasNode } from '@/lib/atlas';
import { Breadcrumb } from '@/app/s/[shareId]/Breadcrumb';
import { AtlasTreemapView } from './AtlasTreemapView';
import { AtlasDetailPanel } from './AtlasDetailPanel';

interface AtlasBrowserProps {
  initialPath: string[];
}

export function AtlasBrowser({ initialPath }: AtlasBrowserProps) {
  const [pathKeys, setPathKeys] = useState<string[]>(initialPath);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const { node: currentNode, chain } = useMemo(() => resolveUrlPath(pathKeys), [pathKeys]);

  const children = useMemo(
    () => getAtlasChildren(currentNode?.id ?? null),
    [currentNode],
  );

  const breadcrumbSegments = useMemo(
    () => chain.map(n => ({ id: n.canonicalKey, label: n.displayName })),
    [chain],
  );

  const selectedNode = useMemo(
    () => selectedNodeId ? getAtlasNode(selectedNodeId) ?? null : null,
    [selectedNodeId],
  );

  const handleNodeClick = useCallback((node: AtlasNode) => {
    if (node.childIds.length > 0) {
      // Drill down
      const newKeys = [...pathKeys, node.canonicalKey];
      setPathKeys(newKeys);
      setSelectedNodeId(null);
      const newPath = `/atlas/${newKeys.join('/')}`;
      window.history.pushState(null, '', newPath);
    } else {
      // Leaf -- show detail panel
      setSelectedNodeId(node.id);
    }
  }, [pathKeys]);

  const handleNavigate = useCallback((newPathIds: string[]) => {
    setPathKeys(newPathIds);
    setSelectedNodeId(null);
    const newPath = newPathIds.length > 0 ? `/atlas/${newPathIds.join('/')}` : '/atlas';
    window.history.pushState(null, '', newPath);
  }, []);

  const handleDismiss = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  return (
    <div>
      {/* Atlas treemap */}
      <AtlasTreemapView
        nodes={children}
        onNodeClick={handleNodeClick}
        currentNode={currentNode}
      />

      {/* Breadcrumb -- below treemap */}
      <div style={{ marginTop: 10 }}>
        <Breadcrumb
          rootLabel="Atlas"
          segments={breadcrumbSegments}
          pathIds={pathKeys}
          onNavigate={handleNavigate}
        />
      </div>

      {/* Detail panel for leaf nodes */}
      <AtlasDetailPanel node={selectedNode} onDismiss={handleDismiss} />
    </div>
  );
}
