const SHARE_API_BASE =
  process.env.SHARE_API_URL || 'https://vynr-share.vynr.workers.dev';

export interface SharePack {
  packId: string;
  schemaVersion: number;
  provider: {
    providerId: string;
    providerDisplayName: string;
    providerKind: string;
    attributionLine?: string;
    websiteURL?: string;
    notesLabel?: string;
  };
  theme?: {
    headerImageRef?: string;
    logoImageRef?: string;
    headerTreatment?: string;
    accentColor?: string;
  };
  snapshot: {
    snapshotTitle: string;
    snapshotSubtitle?: string;
    snapshotDescription?: string;
    shareMode: string;
    scopeKind: string;
    itemCount: number;
    createdAt: string;
  };
  policy?: {
    cloneAllowed?: boolean;
    notesIncluded?: string;
    notesCarryOnClone?: boolean;
    quantityVisibility?: string;
  };
  entries: ShareEntry[];
}

export interface ShareEntry {
  externalEntryId: string;
  wineName: string;
  producer?: string;
  vintage?: number;
  wineType: string;
  country: string;
  region?: string;
  appellation?: string;
  varietals?: string[];
  providerNote?: string;
}

export type ShareResult =
  | { kind: 'active'; pack: SharePack }
  | { kind: 'unavailable'; message: string; title?: string; providerDisplayName?: string }
  | { kind: 'notFound' };

export async function fetchShare(shareId: string): Promise<ShareResult> {
  const res = await fetch(`${SHARE_API_BASE}/api/shares/${shareId}`, {
    next: { revalidate: 60 },
  });

  if (res.status === 404) {
    return { kind: 'notFound' };
  }

  if (res.status === 410) {
    const data = await res.json().catch(() => ({}));
    return {
      kind: 'unavailable',
      message: data.message || 'This shared cellar is no longer available.',
      title: data.title,
      providerDisplayName: data.providerDisplayName,
    };
  }

  if (!res.ok) {
    return { kind: 'notFound' };
  }

  const pack: SharePack = await res.json();
  return { kind: 'active', pack };
}
