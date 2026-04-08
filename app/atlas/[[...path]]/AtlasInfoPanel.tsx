'use client';

import { useMemo } from 'react';
import type { AtlasNode } from '@/lib/atlas';
import { getEducation } from '@/lib/education';

interface AtlasInfoPanelProps {
  currentNode: AtlasNode | null;
  childCount: number;
}

export function AtlasInfoPanel({ currentNode, childCount }: AtlasInfoPanelProps) {
  const education = useMemo(
    () => currentNode ? getEducation(currentNode.id) : undefined,
    [currentNode],
  );

  // Root level — welcome message
  if (!currentNode) {
    return (
      <div style={panelStyle}>
        <p style={{
          fontSize: '0.95rem',
          color: 'var(--atlas-text-secondary)',
          lineHeight: 1.6,
          margin: 0,
          fontStyle: 'italic',
        }}>
          Explore the world of wine — from continents to appellations
        </p>
      </div>
    );
  }

  // Node with education content
  if (education) {
    return (
      <div style={panelStyle}>
        <h2 style={{
          fontSize: '1.2rem',
          fontWeight: 600,
          color: 'var(--atlas-text)',
          margin: '0 0 10px',
          lineHeight: 1.3,
          letterSpacing: '-0.01em',
        }}>
          {education.name}
        </h2>

        <p style={{
          fontSize: '0.88rem',
          color: 'var(--atlas-text-secondary)',
          lineHeight: 1.7,
          margin: '0 0 14px',
        }}>
          {education.description}
        </p>

        {/* Key grapes */}
        {education.keyGrapes.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {education.keyGrapes.map((grape) => (
              <span
                key={grape}
                style={{
                  display: 'inline-block',
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  letterSpacing: '0.03em',
                  padding: '3px 10px',
                  borderRadius: 20,
                  background: 'rgba(200, 188, 170, 0.15)',
                  color: 'var(--atlas-text-secondary)',
                  border: '1px solid rgba(200, 188, 170, 0.30)',
                }}
              >
                {grape}
              </span>
            ))}
          </div>
        )}

        {/* Style note */}
        {education.style && (
          <p style={{
            fontSize: '0.8rem',
            color: 'var(--atlas-text-placeholder)',
            fontStyle: 'italic',
            margin: 0,
            lineHeight: 1.5,
          }}>
            {education.style}
          </p>
        )}
      </div>
    );
  }

  // Node without education — show name and child hint
  return (
    <div style={panelStyle}>
      <h2 style={{
        fontSize: '1.2rem',
        fontWeight: 600,
        color: 'var(--atlas-text)',
        margin: '0 0 6px',
        lineHeight: 1.3,
        letterSpacing: '-0.01em',
      }}>
        {currentNode.displayName}
      </h2>

      {childCount > 0 && currentNode.childLevelHint && (
        <p style={{
          fontSize: '0.85rem',
          color: 'var(--atlas-text-placeholder)',
          margin: 0,
        }}>
          {childCount} {currentNode.childLevelHint.toLowerCase()}{childCount !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  background: 'var(--atlas-card)',
  border: '1px solid var(--atlas-card-stroke)',
  borderRadius: 10,
  padding: '18px 22px',
  marginTop: 12,
  maxHeight: 300,
  overflowY: 'auto',
};
