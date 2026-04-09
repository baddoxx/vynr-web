'use client';

import { useMemo } from 'react';
import { type CellarNode, flattenWines, isWineNode } from '@/lib/cellar-tree';
import { WineCard } from './WineCard';

interface ListViewProps {
  nodes: CellarNode[];
  isTerminalPath: boolean;
  shareId: string;
  onNodeClick: (node: CellarNode) => void;
}

export function ListView({ nodes, isTerminalPath, shareId, onNodeClick }: ListViewProps) {
  // Flatten all wines under current scope into a single alphabetical list,
  // matching the app's list view behavior.
  const wines = useMemo(() => {
    const all = nodes.flatMap((node) =>
      isWineNode(node) && node.entry ? [node.entry] : flattenWines(node)
    );
    return all.sort((a, b) => a.wineName.localeCompare(b.wineName));
  }, [nodes]);

  // Build a fake wine CellarNode for click handling (opens detail panel)
  const handleWineClick = useMemo(() => {
    const nodeMap = new Map<string, CellarNode>();
    function walk(n: CellarNode) {
      if (isWineNode(n)) nodeMap.set(n.entry?.externalEntryId ?? '', n);
      for (const child of n.children) walk(child);
    }
    for (const n of nodes) walk(n);
    return (entryId: string) => {
      const node = nodeMap.get(entryId);
      if (node) onNodeClick(node);
    };
  }, [nodes, onNodeClick]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {wines.map((entry) => (
        <WineCard
          key={entry.externalEntryId}
          entry={entry}
          shareId={shareId}
          onClick={() => handleWineClick(entry.externalEntryId)}
        />
      ))}
    </div>
  );
}
