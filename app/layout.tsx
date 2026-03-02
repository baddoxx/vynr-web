import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://vynr.app"),
  title: {
    default: "Vynr",
    template: "%s — Vynr",
  },
  description: "A private wine cellar and tasting journal. Atlas maps, tasting notes, and region education.",
  openGraph: {
    title: "Vynr — Wine Cellar & Journal",
    description: "A private wine cellar and tasting journal. Atlas maps, tasting notes, and region education.",
    url: "https://vynr.app",
    siteName: "Vynr",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Vynr" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vynr — Wine Cellar & Journal",
    description: "A private wine cellar and tasting journal. Atlas maps, tasting notes, and region education.",
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
    "A private wine cellar and tasting journal. Atlas maps, tasting notes, and region education — all on-device.",
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
          </nav>
        </header>

        <main>{children}</main>

        <footer
          style={{
            borderTop: "1px solid var(--atlas-separator)",
            padding: "2rem 1.5rem",
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
        </footer>
      </body>
    </html>
  );
}
