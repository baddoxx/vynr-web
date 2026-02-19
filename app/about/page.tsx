import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "A private wine cellar and tasting journal. No ratings, no social feeds — just wine, remembered.",
};

export default function AboutPage() {
  return (
    <section
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "48px 24px 80px",
      }}
    >
      <header style={{ marginBottom: "2.5rem" }}>
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
            color: "var(--atlas-text)",
            marginBottom: "0.75rem",
          }}
        >
          About
        </h1>
        <div
          style={{
            width: 40,
            height: 2,
            background: "var(--atlas-tint)",
            marginTop: "1.5rem",
            borderRadius: 1,
          }}
        />
      </header>

      <article className="prose">
        <p>
          vynr is a private wine cellar and tasting journal, backed by an
          interactive atlas of the wine world.
        </p>

        <p>
          After a dinner, someone asks what the second bottle was. You can
          picture the label — cream paper, serif type — but not the name. You
          remember the colour against the tablecloth. You remember who said
          something that mattered. The bottle held all of that, and now
          it&rsquo;s gone.
        </p>

        <p>
          No crowd-sourced ratings. No social feeds. No marketplace. No
          gamification. No advertising. This is not a limitation. It is the
          product.
        </p>

        <h2>Three things, woven together</h2>
        <p>
          <strong>A cellar</strong> — to track what you own.
          <br />
          <strong>A journal</strong> — to record what you experienced.
          <br />
          <strong>An atlas</strong> — to understand where it came from.
        </p>
        <p>
          The atlas gives meaning to the cellar. The journal gives meaning to
          the atlas. The cellar grounds the journal in real wines.
        </p>

        <h2>Who it&rsquo;s for</h2>
        <p>
          People who don&rsquo;t write things down but wish they remembered.
          People who want to recall the dinner, not just the vintage. People
          who appreciate calm, private, beautiful tools.
        </p>

        <hr />

        <p><em>Just wine, remembered.</em></p>
      </article>
    </section>
  );
}
