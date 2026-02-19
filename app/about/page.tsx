import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "vynr is a private wine cellar and tasting journal, backed by an interactive atlas of the wine world.",
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

        <h2>Why it exists</h2>
        <p>
          Wine is overwhelming. Thousands of regions, grape varieties,
          producers. Every bottle tells a story, but most people forget what
          they drank last month.
        </p>
        <p>
          vynr makes wine memorable and geographic. It places every wine you
          encounter into an authoritative map, so understanding builds over
          time instead of starting from scratch.
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
          People who keep notes. People who want to remember the dinner, not
          just the vintage. People who appreciate calm, private, beautiful
          tools.
        </p>
        <p>
          You might scan a label from a Burgundy you brought home and discover
          it&rsquo;s from Gevrey-Chambertin in C&ocirc;te de Nuits. You
          write &ldquo;First Burgundy I really loved.&rdquo; Months later, you
          browse the atlas and notice you keep returning to Northern
          Rh&ocirc;ne — a preference you didn&rsquo;t know you had until you
          saw the pattern.
        </p>

        <h2>What vynr deliberately avoids</h2>
        <p>
          No crowd-sourced ratings. No social feeds. No marketplace. No
          gamification. No algorithmic recommendations. No advertising.
        </p>
        <p>This is not a limitation. It is the product.</p>

        <hr />

        <p><em>Just wine, remembered.</em></p>
      </article>
    </section>
  );
}
