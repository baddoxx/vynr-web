'use client';

import { type CellarNode, canDrill, isWineNode } from '@/lib/cellar-tree';
import { wineTypeTint, wineTypeColor } from '@/lib/treemap-colors';
import { WineCard } from './WineCard';

interface ListViewProps {
  nodes: CellarNode[];
  isTerminalPath: boolean;
  onNodeClick: (node: CellarNode) => void;
}

export function ListView({ nodes, isTerminalPath, onNodeClick }: ListViewProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {nodes.map((node) => {
        if (canDrill(node)) {
          return (
            <button
              key={node.id}
              onClick={() => onNodeClick(node)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                minHeight: 48,
                padding: '12px 16px',
                background: 'var(--atlas-card)',
                border: '1px solid var(--atlas-card-stroke)',
                borderRadius: 10,
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
                borderLeft: node.wineType
                  ? `3px solid ${wineTypeTint(node.wineType, 0.4)}`
                  : '3px solid var(--atlas-card-stroke)',
              }}
            >
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--atlas-text)' }}>
                  {node.label}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--atlas-text-placeholder)', marginTop: 2 }}>
                  {node.weight} {node.weight === 1 ? 'wine' : 'wines'}
                </div>
              </div>
              {/* Chevron */}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, opacity: 0.4 }}>
                <path d="M6 3L11 8L6 13" stroke="var(--atlas-text-placeholder)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          );
        }

        if (isWineNode(node) && node.entry) {
          return (
            <WineCard
              key={node.id}
              entry={node.entry}
              onClick={() => onNodeClick(node)}
            />
          );
        }

        return null;
      })}
    </div>
  );
}
