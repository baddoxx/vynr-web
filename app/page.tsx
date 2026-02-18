import Link from "next/link";

export default function Home() {
  return (
    <section
      style={{
        maxWidth: 600,
        margin: "0 auto",
        padding: "120px 24px 80px",
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

      <p
        style={{
          marginTop: "2rem",
          fontSize: "0.95rem",
          color: "var(--atlas-text-placeholder)",
          lineHeight: 1.7,
          maxWidth: 400,
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        Explore regions. Track bottles. Keep a tasting journal.
      </p>

      <div
        style={{
          marginTop: "3rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <a
          href="#"
          style={{
            display: "inline-block",
            padding: "12px 28px",
            backgroundColor: "var(--atlas-text)",
            color: "var(--atlas-bg)",
            fontSize: "0.875rem",
            fontWeight: 600,
            borderRadius: 10,
            textDecoration: "none",
            letterSpacing: "0.01em",
            transition: "opacity 0.15s ease",
          }}
        >
          Coming soon on the App Store
        </a>

        <Link
          href="/blog"
          style={{
            fontSize: "0.85rem",
            color: "var(--atlas-tint)",
            textDecoration: "none",
            borderBottom: "1px solid var(--atlas-card-stroke)",
            paddingBottom: 2,
            transition: "color 0.15s ease",
          }}
        >
          Read the journal
        </Link>
      </div>

      {/* Decorative separator */}
      <div
        style={{
          marginTop: "5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          color: "var(--atlas-separator)",
        }}
      >
        <span style={{ width: 40, height: 1, background: "var(--atlas-separator)", display: "block" }} />
        <span style={{ fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase" as const }}>
          est. 2026
        </span>
        <span style={{ width: 40, height: 1, background: "var(--atlas-separator)", display: "block" }} />
      </div>
    </section>
  );
}
