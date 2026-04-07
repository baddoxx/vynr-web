import { fetchShare, type SharePack, type ShareEntry } from '@/lib/share-api';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ shareId: string }>;
}): Promise<Metadata> {
  const { shareId } = await params;
  const result = await fetchShare(shareId);

  if (result.kind !== 'active') {
    return {
      title: 'Unavailable',
      robots: { index: false, follow: false },
    };
  }

  const { pack } = result;
  const description =
    pack.snapshot.snapshotDescription ||
    `${pack.snapshot.itemCount} wines shared by ${pack.provider.providerDisplayName}`;

  return {
    title: pack.snapshot.snapshotTitle,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title: pack.snapshot.snapshotTitle,
      description,
      type: 'website',
    },
  };
}

// ─── Wine type colours ────────────────────────────────────────────────────────

const WINE_TYPE_STYLES: Record<
  string,
  { label: string; bg: string; color: string; borderColor: string }
> = {
  red: {
    label: 'Red',
    bg: 'rgba(140, 40, 40, 0.10)',
    color: '#8B2828',
    borderColor: 'rgba(140, 40, 40, 0.20)',
  },
  white: {
    label: 'White',
    bg: 'rgba(160, 140, 60, 0.10)',
    color: '#7A6820',
    borderColor: 'rgba(160, 140, 60, 0.20)',
  },
  rosé: {
    label: 'Rosé',
    bg: 'rgba(180, 90, 100, 0.10)',
    color: '#A84858',
    borderColor: 'rgba(180, 90, 100, 0.20)',
  },
  rose: {
    label: 'Rosé',
    bg: 'rgba(180, 90, 100, 0.10)',
    color: '#A84858',
    borderColor: 'rgba(180, 90, 100, 0.20)',
  },
  sparkling: {
    label: 'Sparkling',
    bg: 'rgba(90, 120, 160, 0.10)',
    color: '#3A5888',
    borderColor: 'rgba(90, 120, 160, 0.20)',
  },
  dessert: {
    label: 'Dessert',
    bg: 'rgba(160, 110, 30, 0.10)',
    color: '#7A5010',
    borderColor: 'rgba(160, 110, 30, 0.20)',
  },
  fortified: {
    label: 'Fortified',
    bg: 'rgba(100, 60, 30, 0.10)',
    color: '#643C1E',
    borderColor: 'rgba(100, 60, 30, 0.20)',
  },
};

function wineTypeStyle(wineType: string) {
  return (
    WINE_TYPE_STYLES[wineType.toLowerCase()] ?? {
      label: wineType,
      bg: 'rgba(100, 90, 80, 0.10)',
      color: 'var(--atlas-text-secondary)',
      borderColor: 'rgba(100, 90, 80, 0.20)',
    }
  );
}

// ─── Geography line ───────────────────────────────────────────────────────────

function geographyLine(entry: ShareEntry): string {
  const parts = [entry.country, entry.region, entry.appellation].filter(Boolean);
  return parts.join(' · ');
}

// ─── Group entries by region ──────────────────────────────────────────────────

interface EntryGroup {
  label: string | null;
  entries: ShareEntry[];
}

function groupEntries(entries: ShareEntry[]): EntryGroup[] {
  const hasRegions = entries.some((e) => e.region);
  if (!hasRegions) {
    return [{ label: null, entries }];
  }

  const order: string[] = [];
  const map = new Map<string, ShareEntry[]>();

  for (const entry of entries) {
    const key = entry.region ?? 'Other';
    if (!map.has(key)) {
      order.push(key);
      map.set(key, []);
    }
    map.get(key)!.push(entry);
  }

  return order.map((label) => ({ label, entries: map.get(label)! }));
}

// ─── Wine entry card ─────────────────────────────────────────────────────────

function WineCard({ entry }: { entry: ShareEntry }) {
  const typeStyle = wineTypeStyle(entry.wineType);
  const geo = geographyLine(entry);

  return (
    <div
      style={{
        background: 'var(--atlas-card)',
        border: '1px solid var(--atlas-card-stroke)',
        borderRadius: 10,
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      {/* Name row + type pill */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <span
          style={{
            fontSize: '0.95rem',
            fontWeight: 600,
            color: 'var(--atlas-text)',
            lineHeight: 1.35,
            flex: 1,
          }}
        >
          {entry.wineName}
        </span>
        <span
          style={{
            fontSize: '0.65rem',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            padding: '3px 8px',
            borderRadius: 20,
            flexShrink: 0,
            marginTop: 2,
            background: typeStyle.bg,
            color: typeStyle.color,
            border: `1px solid ${typeStyle.borderColor}`,
          }}
        >
          {typeStyle.label}
        </span>
      </div>

      {/* Producer + vintage */}
      {(entry.producer || entry.vintage) && (
        <div
          style={{
            fontSize: '0.82rem',
            color: 'var(--atlas-text-secondary)',
            lineHeight: 1.4,
          }}
        >
          {[entry.producer, entry.vintage].filter(Boolean).join(' · ')}
        </div>
      )}

      {/* Geography */}
      {geo && (
        <div
          style={{
            fontSize: '0.75rem',
            color: 'var(--atlas-text-placeholder)',
            letterSpacing: '0.01em',
          }}
        >
          {geo}
        </div>
      )}

      {/* Varietals */}
      {entry.varietals && entry.varietals.length > 0 && (
        <div
          style={{
            fontSize: '0.72rem',
            color: 'var(--atlas-text-placeholder)',
            fontStyle: 'italic',
          }}
        >
          {entry.varietals.join(', ')}
        </div>
      )}

      {/* Provider note */}
      {entry.providerNote && (
        <div
          style={{
            marginTop: 6,
            padding: '9px 12px',
            background: 'var(--atlas-bg)',
            border: '1px solid var(--atlas-separator)',
            borderRadius: 6,
            fontSize: '0.82rem',
            color: 'var(--atlas-text-secondary)',
            fontStyle: 'italic',
            lineHeight: 1.55,
          }}
        >
          {entry.providerNote}
        </div>
      )}
    </div>
  );
}

// ─── Active share view ────────────────────────────────────────────────────────

function ActiveShareView({
  pack,
  shareId,
}: {
  pack: SharePack;
  shareId: string;
}) {
  const groups = groupEntries(pack.entries);
  const { snapshot, provider } = pack;

  return (
    <div
      style={{
        maxWidth: 640,
        margin: '0 auto',
        padding: '40px 20px 80px',
      }}
    >
      {/* ── Header ── */}
      <header style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: '1.8rem',
            fontWeight: 600,
            letterSpacing: '-0.025em',
            lineHeight: 1.2,
            color: 'var(--atlas-text)',
            margin: 0,
          }}
        >
          {snapshot.snapshotTitle}
        </h1>

        {snapshot.snapshotSubtitle && (
          <p
            style={{
              marginTop: 6,
              fontSize: '1rem',
              color: 'var(--atlas-text-secondary)',
              lineHeight: 1.4,
            }}
          >
            {snapshot.snapshotSubtitle}
          </p>
        )}

        {/* Attribution */}
        <div
          style={{
            marginTop: 10,
            fontSize: '0.82rem',
            color: 'var(--atlas-text-placeholder)',
            letterSpacing: '0.01em',
          }}
        >
          Shared by{' '}
          <span style={{ color: 'var(--atlas-text-secondary)', fontWeight: 500 }}>
            {provider.providerDisplayName}
          </span>
          {provider.attributionLine && (
            <>
              {' '}
              &middot; {provider.attributionLine}
            </>
          )}
        </div>

        {/* Description card */}
        {snapshot.snapshotDescription && (
          <div
            style={{
              marginTop: 16,
              padding: '14px 16px',
              background: 'var(--atlas-card)',
              border: '1px solid var(--atlas-card-stroke)',
              borderRadius: 8,
              fontSize: '0.88rem',
              color: 'var(--atlas-text-secondary)',
              lineHeight: 1.65,
            }}
          >
            {snapshot.snapshotDescription}
          </div>
        )}

        {/* Wine count */}
        <div
          style={{
            marginTop: 20,
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--atlas-text-placeholder)',
          }}
        >
          {snapshot.itemCount} {snapshot.itemCount === 1 ? 'wine' : 'wines'}
        </div>
      </header>

      {/* ── Divider ── */}
      <hr
        style={{
          border: 'none',
          borderTop: '1px solid var(--atlas-separator)',
          marginBottom: 24,
        }}
      />

      {/* ── Wine list ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {groups.map((group) => (
          <section key={group.label ?? '__ungrouped'}>
            {group.label && (
              <h2
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--atlas-text-placeholder)',
                  margin: '0 0 10px',
                }}
              >
                {group.label}
              </h2>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {group.entries.map((entry) => (
                <WineCard key={entry.externalEntryId} entry={entry} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* ── CTAs ── */}
      <div
        style={{
          marginTop: 48,
          padding: '24px 20px',
          background: 'var(--atlas-card)',
          border: '1px solid var(--atlas-card-stroke)',
          borderRadius: 12,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <p
          style={{
            fontSize: '0.82rem',
            color: 'var(--atlas-text-secondary)',
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          View this cellar in vynr for the full atlas experience.
        </p>

        {/* Deep link */}
        <a
          href={`vynr://share?id=${shareId}`}
          style={{
            display: 'inline-block',
            padding: '11px 28px',
            fontSize: '0.88rem',
            fontWeight: 600,
            letterSpacing: '0.01em',
            color: 'var(--atlas-bg)',
            background: 'var(--atlas-text)',
            borderRadius: 8,
            textDecoration: 'none',
            transition: 'opacity 0.15s ease',
          }}
        >
          Open in vynr
        </a>

        {/* App Store link */}
        <a
          href="https://apps.apple.com/app/vynr/id6744048730"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: '0.8rem',
            color: 'var(--atlas-tint)',
            textDecoration: 'none',
            borderBottom: '1px solid var(--atlas-separator)',
            paddingBottom: '1px',
            transition: 'color 0.15s ease',
          }}
        >
          Get vynr for iOS
        </a>
      </div>

      {/* ── Page footer ── */}
      <div
        style={{
          marginTop: 40,
          textAlign: 'center',
          fontSize: '0.72rem',
          color: 'var(--atlas-text-placeholder)',
          letterSpacing: '0.04em',
        }}
      >
        <span style={{ opacity: 0.6 }}>Shared via vynr</span>
      </div>
    </div>
  );
}

// ─── Unavailable state ────────────────────────────────────────────────────────

function UnavailableView({
  message,
  title,
  providerDisplayName,
}: {
  message: string;
  title?: string;
  providerDisplayName?: string;
}) {
  return (
    <div
      style={{
        maxWidth: 480,
        margin: '80px auto',
        padding: '0 24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          padding: '32px 28px',
          background: 'var(--atlas-card)',
          border: '1px solid var(--atlas-card-stroke)',
          borderRadius: 12,
        }}
      >
        {title && (
          <h1
            style={{
              fontSize: '1.15rem',
              fontWeight: 600,
              color: 'var(--atlas-text)',
              margin: '0 0 8px',
              letterSpacing: '-0.01em',
            }}
          >
            {title}
          </h1>
        )}
        {providerDisplayName && !title && (
          <p
            style={{
              fontSize: '0.85rem',
              color: 'var(--atlas-text-secondary)',
              margin: '0 0 10px',
            }}
          >
            Shared by {providerDisplayName}
          </p>
        )}
        <p
          style={{
            fontSize: '0.88rem',
            color: 'var(--atlas-text-secondary)',
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          {message}
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SharePage({
  params,
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;
  const result = await fetchShare(shareId);

  if (result.kind === 'notFound') {
    notFound();
  }

  if (result.kind === 'unavailable') {
    return (
      <UnavailableView
        message={result.message}
        title={result.title}
        providerDisplayName={result.providerDisplayName}
      />
    );
  }

  return <ActiveShareView pack={result.pack} shareId={shareId} />;
}
