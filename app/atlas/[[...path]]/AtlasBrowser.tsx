'use client';

import { useState, useMemo, useCallback } from 'react';
import { resolveUrlPath, getAtlasChildren, type AtlasNode } from '@/lib/atlas';
import { Breadcrumb } from '@/app/s/[shareId]/Breadcrumb';
import { AtlasTreemapView } from './AtlasTreemapView';
import { AtlasInfoPanel } from './AtlasInfoPanel';

interface AtlasBrowserProps {
  initialPath: string[];
}

export function AtlasBrowser({ initialPath }: AtlasBrowserProps) {
  const [pathKeys, setPathKeys] = useState<string[]>(initialPath);

  const { node: currentNode, chain } = useMemo(() => resolveUrlPath(pathKeys), [pathKeys]);

  const children = useMemo(
    () => getAtlasChildren(currentNode?.id ?? null),
    [currentNode],
  );

  const breadcrumbSegments = useMemo(
    () => chain.map(n => ({ id: n.canonicalKey, label: n.displayName })),
    [chain],
  );

  const handleNodeClick = useCallback((node: AtlasNode) => {
    const newKeys = [...pathKeys, node.canonicalKey];
    setPathKeys(newKeys);
    const newPath = `/atlas/${newKeys.join('/')}`;
    window.history.pushState(null, '', newPath);
  }, [pathKeys]);

  const handleNavigate = useCallback((newPathIds: string[]) => {
    setPathKeys(newPathIds);
    const newPath = newPathIds.length > 0 ? `/atlas/${newPathIds.join('/')}` : '/atlas';
    window.history.pushState(null, '', newPath);
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

      {/* Info panel -- always visible, shows current node education */}
      <AtlasInfoPanel currentNode={currentNode} childCount={children.length} />
    </div>
  );
}
