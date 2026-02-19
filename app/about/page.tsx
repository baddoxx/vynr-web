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
          After a dinner, you want to keep the shape of it: the bottle that
          made the table go quiet, the acidity that cut through the dish, the
          producer you meant to look up, the way the room felt when the glass
          was lifted. Not as a score, but as a trace — something you can return
          to later.
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
          People who enjoy wine and want a calm place to keep it: what they
          opened, where it came from, and what it meant in the moment. For
          anyone who prefers private tools over public performance — and who
          wants their own record, not the internet&rsquo;s opinion.
        </p>

        <hr />

        <p><em>Just wine, remembered.</em></p>
      </article>
    </section>
  );
}
