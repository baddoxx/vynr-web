'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { ShareEntry } from '@/lib/share-api';
import { wineTypeTint, wineTypeColor, wineTypeBorder } from '@/lib/treemap-colors';

const WINE_TYPE_LABELS: Record<string, string> = {
  red: 'Red', white: 'White', rosé: 'Rosé', rose: 'Rosé',
  sparkling: 'Sparkling', dessert: 'Dessert', fortified: 'Fortified',
  orange: 'Orange',
};

const SHARE_API_BASE = process.env.NEXT_PUBLIC_SHARE_API_URL || 'https://vynr-share.vynr.workers.dev';

interface WineDetailPanelProps {
  wine: ShareEntry | null;
  shareId: string;
  onDismiss: () => void;
}

export function WineDetailPanel({ wine, shareId, onDismiss }: WineDetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  // Focus management
  useEffect(() => {
    if (wine) {
      previousFocus.current = document.activeElement as HTMLElement;
      // Focus panel on next frame
      requestAnimationFrame(() => panelRef.current?.focus());
    } else if (previousFocus.current) {
      previousFocus.current.focus();
      previousFocus.current = null;
    }
  }, [wine]);

  // Escape to dismiss
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onDismiss();
    }
  }, [onDismiss]);

  // Lock body scroll on mobile when open
  useEffect(() => {
    if (wine) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [wine]);

  if (!wine) return null;

  const typeKey = wine.wineType.toLowerCase();
  const typeLabel = WINE_TYPE_LABELS[typeKey] ?? wine.wineType;
  const geo = [wine.country, wine.region, wine.appellation].filter(Boolean).join(' \u00B7 ');

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

      {/* Panel — desktop: right slide-over, mobile: bottom sheet */}
      <div
        ref={panelRef}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-label={`Wine detail: ${wine.wineName}`}
        style={{
          position: 'fixed',
          zIndex: 51,
          background: 'var(--atlas-bg)',
          border: '1px solid var(--atlas-card-stroke)',
          overflowY: 'auto',
          outline: 'none',
          /* Desktop: right slide-over */
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
          {/* Label image */}
          {wine.hasLabelImage && (
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
              <img
                src={`${SHARE_API_BASE}/api/shares/${shareId}/labels/${wine.externalEntryId}`}
                alt=""
                width={120}
                height={120}
                loading="lazy"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                style={{
                  borderRadius: 10,
                  objectFit: 'cover',
                  background: 'var(--atlas-card)',
                }}
              />
            </div>
          )}

          {/* Wine name */}
          <h2 style={{
            fontSize: '1.3rem', fontWeight: 600, color: 'var(--atlas-text)',
            lineHeight: 1.3, margin: '0 0 8px', letterSpacing: '-0.01em',
          }}>
            {wine.wineName}
          </h2>

          {/* Producer */}
          {wine.producer && (
            <div style={{ fontSize: '0.92rem', color: 'var(--atlas-text-secondary)', marginBottom: 6 }}>
              {wine.producer}
            </div>
          )}

          {/* Vintage */}
          {wine.vintage && (
            <div style={{ fontSize: '0.88rem', color: 'var(--atlas-text-secondary)', marginBottom: 12 }}>
              {wine.vintage}
            </div>
          )}

          {/* Geography */}
          {geo && (
            <div style={{
              fontSize: '0.78rem', color: 'var(--atlas-text-placeholder)',
              letterSpacing: '0.01em', marginBottom: 12,
            }}>
              {geo}
            </div>
          )}

          {/* Wine type pill */}
          <span style={{
            display: 'inline-block',
            fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.06em',
            textTransform: 'uppercase' as const,
            padding: '3px 10px', borderRadius: 20,
            background: wineTypeTint(typeKey),
            color: wineTypeColor(typeKey),
            border: `1px solid ${wineTypeBorder(typeKey)}`,
            marginBottom: 16,
          }}>
            {typeLabel}
          </span>

          {/* Varietals */}
          {wine.varietals && wine.varietals.length > 0 && (
            <div style={{
              fontSize: '0.78rem', color: 'var(--atlas-text-placeholder)', marginBottom: 16,
            }}>
              {wine.varietals.join(', ')}
            </div>
          )}

          {/* Provider note */}
          {wine.providerNote && (
            <div style={{
              padding: '12px 14px', background: 'var(--atlas-card)',
              border: '1px solid var(--atlas-separator)', borderRadius: 8,
              fontSize: '0.85rem', color: 'var(--atlas-text-secondary)',
              fontStyle: 'italic', lineHeight: 1.6,
            }}>
              {wine.providerNote}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
