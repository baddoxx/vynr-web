import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://vynr.app"),
  title: {
    default: "Vynr",
    template: "%s — Vynr",
  },
  description: "A private wine atlas, cellar, and tasting journal. Place, time, and memory — all on-device.",
  openGraph: {
    title: "Vynr — Your wines. In place. In time.",
    description: "A private wine atlas, cellar, and tasting journal. Place, time, and memory — all on-device.",
    url: "https://vynr.app",
    siteName: "Vynr",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Vynr" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vynr — Your wines. In place. In time.",
    description: "A private wine atlas, cellar, and tasting journal. Place, time, and memory — all on-device.",
    images: ["/og.png"],
  },
  verification: {
    google: "Os1tmEGLUwFxrDqs2qMmOeMx44Qcu6FRGvRerUYxe3U",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Vynr",
  description:
    "A private wine atlas, cellar, and tasting journal. Place, time, and memory — all on-device.",
  applicationCategory: "LifestyleApplication",
  operatingSystem: "iOS",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/PreOrder",
  },
  author: {
    "@type": "Organization",
    name: "Vynr",
    url: "https://vynr.app",
  },
  url: "https://vynr.app",
  image: "https://vynr.app/og.png",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            backgroundColor: "var(--chrome-bg)",
            borderBottom: "1px solid var(--atlas-separator)",
          }}
        >
          <nav
            style={{
              maxWidth: 720,
              margin: "0 auto",
              padding: "14px 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Link
              href="/"
              style={{
                fontSize: "1.1rem",
                fontWeight: 600,
                color: "var(--atlas-text)",
                textDecoration: "none",
                letterSpacing: "-0.02em",
              }}
            >
              Vynr
            </Link>
            <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
              <Link
                href="/atlas"
                style={{
                  fontSize: "0.875rem",
                  color: "var(--atlas-text-secondary)",
                  textDecoration: "none",
                  transition: "color 0.15s ease",
                }}
              >
                Atlas
              </Link>
              <Link
                href="/blog"
                style={{
                  fontSize: "0.875rem",
                  color: "var(--atlas-text-secondary)",
                  textDecoration: "none",
                  transition: "color 0.15s ease",
                }}
              >
                Blog
              </Link>
            </div>
          </nav>
        </header>

        <main>{children}</main>

        <footer
          style={{
            borderTop: "1px solid var(--atlas-separator)",
            padding: "1.5rem 1.5rem 1.75rem",
            textAlign: "center",
            color: "var(--atlas-text-placeholder)",
            fontSize: "0.8rem",
            letterSpacing: "0.02em",
          }}
        >
          <Link
            href="/about"
            style={{
              color: "var(--atlas-text-placeholder)",
              textDecoration: "none",
              transition: "color 0.15s ease",
            }}
          >
            About
          </Link>
          <span aria-hidden="true" style={{ margin: "0 0.75rem", opacity: 0.4 }}>·</span>
          <Link
            href="/privacy"
            style={{
              color: "var(--atlas-text-placeholder)",
              textDecoration: "none",
              transition: "color 0.15s ease",
            }}
          >
            Privacy
          </Link>
          <span aria-hidden="true" style={{ margin: "0 0.75rem", opacity: 0.4 }}>·</span>
          <Link
            href="/contact"
            style={{
              color: "var(--atlas-text-placeholder)",
              textDecoration: "none",
              transition: "color 0.15s ease",
            }}
          >
            Contact
          </Link>
          <span aria-hidden="true" style={{ margin: "0 0.75rem", opacity: 0.4 }}>·</span>
          <a
            href="https://www.instagram.com/vynr.app"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Vynr on Instagram"
            style={{
              color: "var(--atlas-text-placeholder)",
              textDecoration: "none",
              transition: "color 0.15s ease",
              verticalAlign: "middle",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ display: "inline-block", verticalAlign: "-0.1em" }}
            >
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <circle cx="12" cy="12" r="5" />
              <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
            </svg>
          </a>
          <span aria-hidden="true" style={{ margin: "0 0.75rem", opacity: 0.4 }}>·</span>
          <a
            href="https://www.tiktok.com/@vynr.app"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Vynr on TikTok"
            style={{
              color: "var(--atlas-text-placeholder)",
              textDecoration: "none",
              transition: "color 0.15s ease",
              verticalAlign: "middle",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
              stroke="none"
              style={{ display: "inline-block", verticalAlign: "-0.1em" }}
            >
              <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.43 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.07 2.49 5.57 5.56 5.57 3.07 0 5.56-2.5 5.56-5.57V9.01a7.3 7.3 0 0 0 4.32 1.4V7.3s-1.98.07-3.6-1.48Z" />
            </svg>
          </a>

          <div className="sj-mark-wrap">
            <span className="sj-colophon" title="Silly Jam Pte. Ltd. — publisher of Vynr">
              <svg
                className="sj-jar"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <rect x="7.5" y="3" width="9" height="3.4" rx="1" />
                <rect x="5" y="6.4" width="14" height="14.6" rx="2.6" />
                <line x1="6.4" y1="10.6" x2="17.6" y2="10.6" />
                <line x1="6.4" y1="16.4" x2="17.6" y2="16.4" />
              </svg>
              <span>A Silly Jam Pte. Ltd. product</span>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
