'use client';

import { useMemo } from 'react';
import type { AtlasNode } from '@/lib/atlas';
import { getEducation } from '@/lib/education';
import { grapePillTint } from '@/lib/grape-colors';

/** Build a var:{slug} education ID from a grape name. Matches Python slugify in draft-grape-education.py. */
function grapeEducationId(grape: string): string {
  return `var:${grape
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')       // strip combining marks (É→E, ô→o)
    .replace(/['\u2019\u02bc\u00b7]/g, '-') // apostrophes + middle dot → hyphen (Nero d'Avola → nero-d-avola)
    .replace(/\s+/g, '-')                   // spaces → hyphens
    .replace(/[^a-z0-9-]/g, '')             // strip remaining non-alphanumeric
    .replace(/-{2,}/g, '-')                 // collapse consecutive hyphens
    .replace(/^-|-$/g, '')}`;               // trim leading/trailing hyphens
}

interface AtlasInfoPanelProps {
  currentNode: AtlasNode | null;
  childCount: number;
  selectedGrape?: string | null;
  onGrapeTap?: (grape: string) => void;
}

export function AtlasInfoPanel({ currentNode, childCount, selectedGrape, onGrapeTap }: AtlasInfoPanelProps) {
  // If a grape is selected, show grape education instead
  const grapeEdu = useMemo(
    () => selectedGrape ? getEducation(grapeEducationId(selectedGrape)) : undefined,
    [selectedGrape],
  );

  const education = useMemo(
    () => currentNode ? getEducation(currentNode.id) : undefined,
    [currentNode],
  );

  // Grape education — shown when a grape pill is tapped
  if (selectedGrape && grapeEdu) {
    const tint = grapePillTint(selectedGrape);
    return (
      <div style={panelStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{
            display: 'inline-block', fontSize: '0.7rem', fontWeight: 500,
            padding: '3px 10px', borderRadius: 20,
            background: tint.fill, color: tint.text, border: `1px solid ${tint.border}`,
          }}>
            {selectedGrape}
          </span>
        </div>
        <p style={{ fontSize: '0.88rem', color: 'var(--atlas-text-secondary)', lineHeight: 1.7, margin: '0 0 10px' }}>
          {grapeEdu.description}
        </p>
        {grapeEdu.style && (
          <p style={{ fontSize: '0.8rem', color: 'var(--atlas-text-placeholder)', fontStyle: 'italic', margin: 0, lineHeight: 1.5 }}>
            {grapeEdu.style}
          </p>
        )}
      </div>
    );
  }

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
            {education.keyGrapes.map((grape) => {
              const tint = grapePillTint(grape);
              return (
                <button
                  key={grape}
                  onClick={onGrapeTap ? () => onGrapeTap(grape) : undefined}
                  style={{
                    display: 'inline-block',
                    fontSize: '0.7rem',
                    fontWeight: 500,
                    letterSpacing: '0.03em',
                    padding: '3px 10px',
                    borderRadius: 20,
                    background: tint.fill,
                    color: tint.text,
                    border: `1px solid ${tint.border}`,
                    cursor: onGrapeTap ? 'pointer' : 'default',
                    fontFamily: 'inherit',
                  }}
                >
                  {grape}
                </button>
              );
            })}
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
