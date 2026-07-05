import type { Metadata } from 'next';
import { resolveUrlPath, getAtlasChildren, getAllAtlasNodes, getAtlasNode, buildAtlasUrlPath, atlasNodeCount, atlasDataEpoch, type AtlasNode } from '@/lib/atlas';
import { AtlasBrowser } from './AtlasBrowser';

export async function generateStaticParams() {
  return [
    { path: [] },
    ...getAllAtlasNodes()
      .filter(n => n.level !== 'root')
      .map(n => {
        const segments: string[] = [];
        let cur: AtlasNode | undefined = n;
        while (cur && cur.level !== 'root') {
          segments.unshift(cur.canonicalKey);
          cur = cur.parentId ? getAtlasNode(cur.parentId) : undefined;
        }
        return { path: segments };
      }),
  ];
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}): Promise<Metadata> {
  const { path = [] } = await params;
  const { node } = resolveUrlPath(path);

  const children = getAtlasChildren(node?.id ?? null);
  const childCount = children.length;
  const childLabel = node?.childLevelHint?.toLowerCase() ?? 'region';
  const title = node ? `${node.displayName} — vynr Atlas` : 'Wine Atlas — vynr';
  const description = node
    ? `${node.displayName}${childCount > 0 ? ` — ${childCount} ${childLabel}${childCount !== 1 ? 's' : ''}` : ''}`
    : 'Explore the world of wine. A geographic atlas of wine regions, from continents to appellations.';
  const url = `https://vynr.app${path.length > 0 ? `/atlas/${path.join('/')}` : '/atlas'}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: { title, description, type: 'website', url },
    twitter: { card: 'summary', title, description },
  };
}

export default async function AtlasPage({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const { path = [] } = await params;
  return (
    <div style={{
      maxWidth: 1280, width: '100%', margin: '0 auto', padding: '20px 20px 60px',
      flex: 1, display: 'flex', flexDirection: 'column',
    }}>
      {/* Atlas header */}
      <header style={{ marginBottom: 12 }}>
        <h1 style={{
          fontSize: '1.1rem', fontWeight: 600, letterSpacing: '-0.01em',
          color: 'var(--atlas-text)', margin: 0,
        }}>
          Wine Atlas
        </h1>
        <span style={{
          fontSize: '0.68rem', color: 'var(--atlas-text-placeholder)',
          letterSpacing: '0.02em',
        }}>
          {atlasNodeCount} regions &middot; epoch {atlasDataEpoch}
        </span>
      </header>

      <AtlasBrowser initialPath={path} />

      {/* Attribution — content footnote, close to the atlas */}
      <div style={{
        marginTop: 16, fontSize: '0.65rem',
        color: 'var(--atlas-text-placeholder)', letterSpacing: '0.02em',
        lineHeight: 1.5,
      }}>
        Content is generated and curated by vynr using multiple sources and internal models. It is intended as a guide, not a definitive reference.
      </div>

      {/* Sign-off — anchored to the bottom, just above the site footer */}
      <footer style={{
        marginTop: 'auto', paddingTop: 48, textAlign: 'center', fontSize: '0.68rem',
        color: 'var(--atlas-text-placeholder)', letterSpacing: '0.02em',
        lineHeight: 1.6,
      }}>
        <a
          href="https://apps.apple.com/app/vynr/id6744048730"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--atlas-tint)', textDecoration: 'none' }}
        >
          Explore in vynr for iOS
        </a>
        <div style={{ marginTop: 6, opacity: 0.6 }}>vynr Atlas</div>
      </footer>
    </div>
  );
}
