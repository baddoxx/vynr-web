import type { Metadata } from 'next';
import { resolveUrlPath, getAtlasChildren } from '@/lib/atlas';
import { AtlasBrowser } from './AtlasBrowser';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}): Promise<Metadata> {
  const { path = [] } = await params;
  const { node } = resolveUrlPath(path);

  const children = getAtlasChildren(node?.id ?? null);
  const childCount = children.length;
  const title = node ? `${node.displayName} — vynr Atlas` : 'Wine Atlas — vynr';
  const description = node
    ? `${node.displayName}${childCount > 0 ? ` — ${childCount} ${childCount === 1 ? 'region' : 'regions'}` : ''}`
    : 'Explore the world of wine. A geographic atlas of wine regions, from continents to appellations.';

  return {
    title,
    description,
    robots: { index: true, follow: true },
    openGraph: { title, description, type: 'website' },
  };
}

export default async function AtlasPage({
  params,
}: {
  params: Promise<{ path?: string[] }>;
}) {
  const { path = [] } = await params;
  return (
    <div className="share-page-light" style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px 80px' }}>
      <AtlasBrowser initialPath={path} />

      <div style={{
        marginTop: 48, textAlign: 'center', fontSize: '0.72rem',
        color: 'var(--atlas-text-placeholder)', letterSpacing: '0.02em',
      }}>
        <a
          href="https://apps.apple.com/app/vynr/id6744048730"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--atlas-tint)', textDecoration: 'none' }}
        >
          Explore in vynr for iOS
        </a>
        <div style={{ marginTop: 6, opacity: 0.5 }}>vynr Atlas</div>
      </div>
    </div>
  );
}
