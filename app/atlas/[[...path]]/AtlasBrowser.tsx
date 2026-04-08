'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { resolveUrlPath, getAtlasChildren, type AtlasNode } from '@/lib/atlas';
import { Breadcrumb } from '@/app/components/Breadcrumb';
import { AtlasTreemapView } from './AtlasTreemapView';
import { AtlasInfoPanel } from './AtlasInfoPanel';

interface AtlasBrowserProps {
  initialPath: string[];
}

export function AtlasBrowser({ initialPath }: AtlasBrowserProps) {
  const [pathKeys, setPathKeys] = useState<string[]>(initialPath);
  const [selectedLeafId, setSelectedLeafId] = useState<string | null>(null);
  const [selectedGrape, setSelectedGrape] = useState<string | null>(null);

  // Sync pathKeys from URL on browser back/forward navigation
  useEffect(() => {
    const handler = () => {
      const segments = window.location.pathname.replace(/^\/atlas\/?/, '').split('/').filter(Boolean);
      setPathKeys(segments);
      setSelectedLeafId(null);
      setSelectedGrape(null);
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  const { node: currentNode, chain } = useMemo(() => resolveUrlPath(pathKeys), [pathKeys]);

  const children = useMemo(
    () => getAtlasChildren(currentNode?.id ?? null),
    [currentNode],
  );

  // Resolve selected leaf node for info panel display
  const selectedLeafNode = useMemo(() => {
    if (!selectedLeafId) return null;
    return children.find(n => n.id === selectedLeafId) ?? null;
  }, [selectedLeafId, children]);

  const breadcrumbSegments = useMemo(
    () => chain.map(n => ({ id: n.canonicalKey, label: n.displayName })),
    [chain],
  );

  const handleNodeClick = useCallback((node: AtlasNode) => {
    if (node.childIds.length > 0) {
      // Container — drill down
      const newKeys = [...pathKeys, node.canonicalKey];
      setPathKeys(newKeys);
      setSelectedLeafId(null);
      setSelectedGrape(null);
      const newPath = `/atlas/${newKeys.join('/')}`;
      window.history.pushState(null, '', newPath);
    } else {
      // Leaf — show education in info panel, don't drill
      setSelectedLeafId(node.id);
      setSelectedGrape(null);
    }
  }, [pathKeys]);

  const handleNavigate = useCallback((newPathIds: string[]) => {
    setPathKeys(newPathIds);
    setSelectedLeafId(null);
    setSelectedGrape(null);
    const newPath = newPathIds.length > 0 ? `/atlas/${newPathIds.join('/')}` : '/atlas';
    window.history.pushState(null, '', newPath);
  }, []);

  const handleGrapeTap = useCallback((grape: string) => {
    setSelectedGrape(grape);
    setSelectedLeafId(null);
  }, []);

  const infoPanelKey = selectedGrape ?? selectedLeafNode?.id ?? currentNode?.id ?? 'root';

  return (
    <div className="atlas-layout">
      <div className="atlas-main">
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
      </div>

      {/* Info panel -- shows selected leaf or current node education */}
      <div className="atlas-sidebar">
        <AtlasInfoPanel
          key={infoPanelKey}
          currentNode={selectedLeafNode ?? currentNode}
          childCount={selectedLeafNode ? selectedLeafNode.childIds.length : children.length}
          selectedGrape={selectedGrape}
          onGrapeTap={handleGrapeTap}
        />
      </div>
    </div>
  );
}
