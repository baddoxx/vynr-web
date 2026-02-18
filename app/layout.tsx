import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://vynr.app"),
  title: {
    default: "Vynr",
    template: "%s — Vynr",
  },
  description: "A quiet atlas for wine.",
  openGraph: {
    title: "Vynr",
    description: "A quiet atlas for wine.",
    url: "https://vynr.app",
    siteName: "Vynr",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Vynr" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vynr",
    description: "A quiet atlas for wine.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
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
              onMouseOver={undefined}
            >
              Journal
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
            href="/privacy"
            style={{
              color: "var(--atlas-text-placeholder)",
              textDecoration: "none",
              transition: "color 0.15s ease",
            }}
          >
            Privacy
          </Link>
          <span style={{ margin: "0 0.75rem", opacity: 0.4 }}>·</span>
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
        </footer>
      </body>
    </html>
  );
}
