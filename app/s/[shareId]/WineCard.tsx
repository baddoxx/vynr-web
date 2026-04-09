import type { ShareEntry } from '@/lib/share-api';
import { wineTypeTint, wineTypeColor, wineTypeBorder } from '@/lib/treemap-colors';

// Worker URL is public (not a secret). Uses NEXT_PUBLIC_ prefix because this
// component runs in the client bundle (imported by ListView which is 'use client').
const SHARE_API_BASE = process.env.NEXT_PUBLIC_SHARE_API_URL || 'https://vynr-share.vynr.workers.dev';

const WINE_TYPE_LABELS: Record<string, string> = {
  red: 'Red', white: 'White', rosé: 'Rosé', rose: 'Rosé',
  sparkling: 'Sparkling', dessert: 'Dessert', fortified: 'Fortified',
  orange: 'Orange',
};

function wineTypeStyle(wineType: string) {
  const key = wineType.toLowerCase();
  return {
    label: WINE_TYPE_LABELS[key] ?? wineType,
    bg: wineTypeTint(key),
    color: wineTypeColor(key),
    borderColor: wineTypeBorder(key),
  };
}

function geographyLine(entry: ShareEntry): string {
  const parts = [entry.country, entry.region, entry.appellation].filter(Boolean);
  return parts.join(' \u00B7 ');
}

interface WineCardProps {
  entry: ShareEntry;
  shareId: string;
  onClick?: () => void;
}

export function WineCard({ entry, shareId, onClick }: WineCardProps) {
  const typeStyle = wineTypeStyle(entry.wineType);
  const geo = geographyLine(entry);

  const labelUrl = entry.hasLabelImage
    ? `${SHARE_API_BASE}/api/shares/${shareId}/labels/${entry.externalEntryId}`
    : null;

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      style={{
        background: 'var(--atlas-card)',
        border: '1px solid var(--atlas-card-stroke)',
        borderRadius: 10,
        padding: '16px 18px',
        display: 'flex',
        gap: 14,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {labelUrl && (
        <img
          src={labelUrl}
          alt=""
          width={48}
          height={48}
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          style={{
            borderRadius: 6,
            objectFit: 'cover',
            flexShrink: 0,
            background: 'var(--atlas-bg)',
          }}
        />
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--atlas-text)', lineHeight: 1.35, flex: 1 }}>
            {entry.wineName}
          </span>
          <span
            style={{
              fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const,
              padding: '3px 8px', borderRadius: 20, flexShrink: 0, marginTop: 2,
              background: typeStyle.bg, color: typeStyle.color, border: `1px solid ${typeStyle.borderColor}`,
            }}
          >
            {typeStyle.label}
          </span>
        </div>
        {(entry.producer || entry.vintage) && (
          <div style={{ fontSize: '0.82rem', color: 'var(--atlas-text-secondary)', lineHeight: 1.4 }}>
            {[entry.producer, entry.vintage].filter(Boolean).join(' \u00B7 ')}
          </div>
        )}
        {geo && (
          <div style={{ fontSize: '0.75rem', color: 'var(--atlas-text-placeholder)', letterSpacing: '0.01em' }}>
            {geo}
          </div>
        )}
        {entry.varietals && entry.varietals.length > 0 && (
          <div style={{ fontSize: '0.72rem', color: 'var(--atlas-text-placeholder)' }}>
            {entry.varietals.join(', ')}
          </div>
        )}
        {entry.providerNote && (
          <div
            style={{
              marginTop: 6, padding: '9px 12px', background: 'var(--atlas-bg)',
              border: '1px solid var(--atlas-separator)', borderRadius: 6,
              fontSize: '0.82rem', color: 'var(--atlas-text-secondary)', fontStyle: 'italic', lineHeight: 1.55,
            }}
          >
            {entry.providerNote}
          </div>
        )}
      </div>
    </div>
  );
}
