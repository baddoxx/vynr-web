'use client';

interface ViewToggleProps {
  viewMode: 'treemap' | 'list';
  onToggle: (mode: 'treemap' | 'list') => void;
}

export function ViewToggle({ viewMode, onToggle }: ViewToggleProps) {
  return (
    <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
      <button
        onClick={() => onToggle('treemap')}
        aria-label="Treemap view"
        aria-pressed={viewMode === 'treemap'}
        style={{
          padding: '4px 8px', borderRadius: '4px 0 0 4px',
          border: '1px solid var(--atlas-card-stroke)',
          background: viewMode === 'treemap' ? 'var(--atlas-card)' : 'transparent',
          color: viewMode === 'treemap' ? 'var(--atlas-text)' : 'var(--atlas-text-placeholder)',
          cursor: 'pointer', fontSize: '0.72rem',
          fontWeight: viewMode === 'treemap' ? 600 : 400, lineHeight: 1,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <rect x="1" y="1" width="5" height="5" rx="1" fill="currentColor" />
          <rect x="8" y="1" width="5" height="5" rx="1" fill="currentColor" />
          <rect x="1" y="8" width="5" height="5" rx="1" fill="currentColor" />
          <rect x="8" y="8" width="5" height="5" rx="1" fill="currentColor" />
        </svg>
      </button>
      <button
        onClick={() => onToggle('list')}
        aria-label="List view"
        aria-pressed={viewMode === 'list'}
        style={{
          padding: '4px 8px', borderRadius: '0 4px 4px 0',
          border: '1px solid var(--atlas-card-stroke)', borderLeft: 'none',
          background: viewMode === 'list' ? 'var(--atlas-card)' : 'transparent',
          color: viewMode === 'list' ? 'var(--atlas-text)' : 'var(--atlas-text-placeholder)',
          cursor: 'pointer', fontSize: '0.72rem',
          fontWeight: viewMode === 'list' ? 600 : 400, lineHeight: 1,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <rect x="1" y="2" width="12" height="2" rx="1" fill="currentColor" />
          <rect x="1" y="6" width="12" height="2" rx="1" fill="currentColor" />
          <rect x="1" y="10" width="12" height="2" rx="1" fill="currentColor" />
        </svg>
      </button>
    </div>
  );
}
