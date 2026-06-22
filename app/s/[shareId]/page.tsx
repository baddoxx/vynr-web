import { fetchShare, type SharePack, type ShareEntry, type MarginaliaEntry } from '@/lib/share-api';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buildHierarchy } from '@/lib/cellar-tree';
import { CellarBrowser } from './CellarBrowser';

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

// ─── Active share view ────────────────────────────────────────────────────────

function ActiveShareView({
  pack,
  shareId,
}: {
  pack: SharePack;
  shareId: string;
}) {
  const { snapshot, provider } = pack;
  const tree = buildHierarchy(pack.entries);
  const rootLabel = snapshot.snapshotTitle || 'Cellar';

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '40px 20px 80px' }}>
      {/* ── Header ── */}
      <header style={{ marginBottom: 32 }}>
        <h1 style={{
          fontSize: '1.8rem', fontWeight: 600, letterSpacing: '-0.025em',
          lineHeight: 1.2, color: 'var(--atlas-text)', margin: 0,
        }}>
          {snapshot.snapshotTitle}
        </h1>

        {snapshot.snapshotSubtitle && (
          <p style={{ marginTop: 6, fontSize: '1rem', color: 'var(--atlas-text-secondary)', lineHeight: 1.4 }}>
            {snapshot.snapshotSubtitle}
          </p>
        )}

        <div style={{
          marginTop: 10, fontSize: '0.82rem', color: 'var(--atlas-text-placeholder)', letterSpacing: '0.01em',
        }}>
          Shared by{' '}
          <span style={{ color: 'var(--atlas-text-secondary)', fontWeight: 500 }}>
            {provider.providerDisplayName}
          </span>
          {provider.attributionLine && <> &middot; {provider.attributionLine}</>}
        </div>

        {snapshot.snapshotDescription && (
          <div style={{
            marginTop: 16, padding: '14px 16px', background: 'var(--atlas-card)',
            border: '1px solid var(--atlas-card-stroke)', borderRadius: 8,
            fontSize: '0.88rem', color: 'var(--atlas-text-secondary)', lineHeight: 1.65,
          }}>
            {snapshot.snapshotDescription}
          </div>
        )}

        <div style={{
          marginTop: 20, fontSize: '0.75rem', fontWeight: 600,
          letterSpacing: '0.08em', textTransform: 'uppercase' as const,
          color: 'var(--atlas-text-placeholder)',
        }}>
          {snapshot.itemCount} {snapshot.itemCount === 1 ? 'wine' : 'wines'}
        </div>
      </header>

      {/* ── Cellar Browser (replaces treemap hero + divider + wine list) ── */}
      {pack.entries.length > 0 && (
        <CellarBrowser
          tree={tree}
          rootLabel={rootLabel}
          shareId={shareId}
          marginalia={pack.marginalia ?? []}
          curatorName={provider.providerDisplayName}
          accentColor={pack.theme?.accentColor}
        />
      )}

      {/* ── Footer — quiet, subordinate ── */}
      <div style={{
        marginTop: 48, textAlign: 'center', fontSize: '0.72rem',
        color: 'var(--atlas-text-placeholder)', letterSpacing: '0.02em',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      }}>
        <a
          href={`vynr://share?id=${shareId}`}
          style={{
            color: 'var(--atlas-tint)', textDecoration: 'none',
            borderBottom: '1px solid var(--atlas-separator)', paddingBottom: '1px',
          }}
        >
          Open in vynr
        </a>
        <a
          href="https://apps.apple.com/app/vynr/id6744048730"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: 'var(--atlas-text-placeholder)', textDecoration: 'none',
          }}
        >
          Get vynr for iOS
        </a>
        <span style={{ opacity: 0.5, marginTop: 4 }}>Shared via vynr</span>
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
