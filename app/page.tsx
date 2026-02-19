import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <section
      style={{
        maxWidth: 600,
        margin: "0 auto",
        padding: "80px 24px 80px",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          fontSize: "3.2rem",
          fontWeight: 600,
          letterSpacing: "-0.03em",
          lineHeight: 1.1,
          color: "var(--atlas-text)",
        }}
      >
        Vynr
      </h1>

      <p
        style={{
          marginTop: "1.5rem",
          fontSize: "1.25rem",
          color: "var(--atlas-text-secondary)",
          fontStyle: "italic",
          lineHeight: 1.5,
        }}
      >
        A quiet atlas for wine.
      </p>

      {/* Hero — wine glass illustration */}
      <div style={{ marginTop: "2.5rem", marginBottom: "2.5rem" }}>
        <Image
          src="/journal/vynr-glass.png"
          alt="A wine glass, ink illustration"
          width={240}
          height={240}
          style={{ width: 240, height: "auto", margin: "0 auto", display: "block" }}
          priority
        />
      </div>

      <p
        style={{
          fontSize: "1rem",
          fontWeight: 600,
          color: "var(--atlas-text)",
          letterSpacing: "-0.01em",
        }}
      >
        Coming soon on the App Store
      </p>

      <div style={{ marginTop: "1.5rem" }}>
        <Link
          href="/blog"
          style={{
            fontSize: "0.85rem",
            color: "var(--atlas-text-placeholder)",
            textDecoration: "none",
            letterSpacing: "0.02em",
            transition: "color 0.15s ease",
          }}
        >
          Read the blog
        </Link>
      </div>

      {/* Decorative separator */}
      <div
        style={{
          marginTop: "4rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          color: "var(--atlas-separator)",
        }}
      >
        <span aria-hidden="true" style={{ width: 40, height: 1, background: "var(--atlas-separator)", display: "block" }} />
        <span style={{ fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase" as const }}>
          est. 2026
        </span>
        <span aria-hidden="true" style={{ width: 40, height: 1, background: "var(--atlas-separator)", display: "block" }} />
      </div>
    </section>
  );
}
