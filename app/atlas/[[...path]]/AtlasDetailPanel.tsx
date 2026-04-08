'use client';

import { useEffect, useRef, useCallback } from 'react';
import { getAtlasNode, type AtlasNode } from '@/lib/atlas';

interface AtlasDetailPanelProps {
  node: AtlasNode | null;
  onDismiss: () => void;
}

const LEVEL_LABELS: Record<string, string> = {
  continent: 'Continent',
  country: 'Country',
  geoUnit: 'Wine Region',
};

const ROLE_LABELS: Record<string, string> = {
  regulatedDesignation: 'Regulated Designation',
  administrativeRegion: 'Administrative Region',
  wineRegion: 'Wine Region',
  subRegion: 'Sub-Region',
};

export function AtlasDetailPanel({ node, onDismiss }: AtlasDetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (node) {
      previousFocus.current = document.activeElement as HTMLElement;
      requestAnimationFrame(() => panelRef.current?.focus());
    } else if (previousFocus.current) {
      previousFocus.current.focus();
      previousFocus.current = null;
    }
  }, [node]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onDismiss();
    }
  }, [onDismiss]);

  useEffect(() => {
    if (node) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [node]);

  if (!node) return null;

  // Resolve parent for display
  const parent = node.parentId ? getAtlasNode(node.parentId) : null;
  const parentLabel = parent && parent.level !== 'root' ? parent.displayName : null;

  const childCount = node.childIds.length;
  const levelLabel = LEVEL_LABELS[node.level] ?? node.level;
  const roleLabel = node.role ? ROLE_LABELS[node.role] ?? node.role : null;
  const classification = node.classification;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onDismiss}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          background: 'rgba(0, 0, 0, 0.15)',
        }}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-label={`Atlas detail: ${node.displayName}`}
        style={{
          position: 'fixed',
          zIndex: 51,
          background: 'var(--atlas-bg)',
          border: '1px solid var(--atlas-card-stroke)',
          overflowY: 'auto',
          outline: 'none',
          right: 0,
          top: 0,
          bottom: 0,
          width: 380,
          borderRadius: '0',
          borderLeft: '1px solid var(--atlas-card-stroke)',
        }}
        className="wine-detail-panel"
      >
        {/* Close button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 16px 0' }}>
          <button
            onClick={onDismiss}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              color: 'var(--atlas-text-placeholder)',
              fontSize: '1.2rem',
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '8px 24px 32px' }}>
          {/* Display name */}
          <h2 style={{
            fontSize: '1.3rem', fontWeight: 600, color: 'var(--atlas-text)',
            lineHeight: 1.3, margin: '0 0 8px', letterSpacing: '-0.01em',
          }}>
            {node.displayName}
          </h2>

          {/* Parent region */}
          {parentLabel && (
            <div style={{ fontSize: '0.92rem', color: 'var(--atlas-text-secondary)', marginBottom: 6 }}>
              {parentLabel}
            </div>
          )}

          {/* Country code */}
          {node.countryCode && (
            <div style={{ fontSize: '0.78rem', color: 'var(--atlas-text-placeholder)', marginBottom: 12 }}>
              {node.countryCode.toUpperCase()}
            </div>
          )}

          {/* Classification + role pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            {classification && (
              <span style={{
                display: 'inline-block',
                fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.06em',
                textTransform: 'uppercase',
                padding: '3px 10px', borderRadius: 20,
                background: 'rgba(200, 188, 170, 0.15)',
                color: 'var(--atlas-text-secondary)',
                border: '1px solid rgba(200, 188, 170, 0.30)',
              }}>
                {classification}
              </span>
            )}
            {roleLabel && (
              <span style={{
                display: 'inline-block',
                fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.06em',
                textTransform: 'uppercase',
                padding: '3px 10px', borderRadius: 20,
                background: 'rgba(200, 188, 170, 0.15)',
                color: 'var(--atlas-text-secondary)',
                border: '1px solid rgba(200, 188, 170, 0.30)',
              }}>
                {roleLabel}
              </span>
            )}
          </div>

          {/* Level */}
          <div style={{
            fontSize: '0.78rem', color: 'var(--atlas-text-placeholder)',
            letterSpacing: '0.01em', marginBottom: 12,
          }}>
            {levelLabel}
          </div>

          {/* Typical wine type */}
          {node.typicalWineType && (
            <div style={{
              fontSize: '0.78rem', color: 'var(--atlas-text-placeholder)',
              marginBottom: 12,
            }}>
              Typical: {node.typicalWineType}
            </div>
          )}

          {/* Children hint */}
          {childCount > 0 && node.childLevelHint && (
            <div style={{
              marginTop: 16, padding: '12px 14px', background: 'var(--atlas-card)',
              border: '1px solid var(--atlas-separator)', borderRadius: 8,
              fontSize: '0.85rem', color: 'var(--atlas-text-secondary)',
              lineHeight: 1.6,
            }}>
              {childCount} {node.childLevelHint.toLowerCase()}{childCount !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
