import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <section
      style={{
        maxWidth: 600,
        margin: "0 auto",
        padding: "clamp(36px, 9vw, 64px) 24px clamp(44px, 11vw, 80px)",
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
          marginTop: "1.25rem",
          fontSize: "1.1rem",
          color: "var(--atlas-text-secondary)",
          letterSpacing: "0.02em",
          lineHeight: 1.5,
        }}
      >
        Your wines. In place. In time.
      </p>

      {/* Hero — wine glass illustration */}
      <div style={{ marginTop: "clamp(1.75rem, 8vw, 3.5rem)", marginBottom: "0.75rem" }}>
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
          fontSize: "1.05rem",
          fontWeight: 600,
          color: "var(--atlas-text)",
          letterSpacing: "-0.01em",
        }}
      >
        Be the first to map your taste.
      </p>

      <p
        style={{
          marginTop: "0.5rem",
          fontSize: "0.85rem",
          color: "var(--atlas-text-secondary)",
          letterSpacing: "0.01em",
          lineHeight: 1.5,
        }}
      >
        Vynr launches soon on iOS.
      </p>

      <form
        action="https://buttondown.com/api/emails/embed-subscribe/vynr"
        method="post"
        target="popupwindow"
        style={{
          marginTop: "1.25rem",
          display: "flex",
          gap: "0.5rem",
          justifyContent: "center",
          maxWidth: 360,
          margin: "1.25rem auto 0",
        }}
      >
        <input type="hidden" name="embed" value="1" />
        <input
          type="email"
          name="email"
          placeholder="your@email.com"
          required
          style={{
            flex: 1,
            padding: "10px 14px",
            fontSize: "0.875rem",
            border: "1px solid var(--atlas-separator)",
            borderRadius: 6,
            backgroundColor: "var(--atlas-bg)",
            color: "var(--atlas-text)",
            outline: "none",
            letterSpacing: "0.01em",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "10px 20px",
            fontSize: "0.85rem",
            fontWeight: 600,
            letterSpacing: "0.01em",
            color: "var(--atlas-bg)",
            backgroundColor: "var(--atlas-text)",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Join the early list
        </button>
      </form>

      <p
        style={{
          marginTop: "0.6rem",
          fontSize: "0.75rem",
          color: "var(--atlas-text-placeholder)",
          letterSpacing: "0.01em",
        }}
      >
        No spam. One email when the app launches.
      </p>

      <div style={{ marginTop: "clamp(1.5rem, 7vw, 3rem)" }}>
        <Link
          href="/blog"
          style={{
            fontSize: "0.85rem",
            color: "var(--atlas-tint)",
            textDecoration: "none",
            borderBottom: "1px solid var(--atlas-separator)",
            paddingBottom: "2px",
            letterSpacing: "0.02em",
            transition: "color 0.15s ease",
          }}
        >
          Read the blog
        </Link>
      </div>

      <p
        style={{
          marginTop: "clamp(1.5rem, 7vw, 3rem)",
          fontSize: "0.7rem",
          letterSpacing: "0.15em",
          textTransform: "uppercase" as const,
          color: "var(--atlas-separator)",
        }}
      >
        est. 2026
      </p>
    </section>
  );
}
