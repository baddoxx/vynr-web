import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the team behind vynr.",
};

export default function ContactPage() {
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
          Contact
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
          For support and feedback:
          <br />
          <a href="mailto:support@vynr.app">support@vynr.app</a>
        </p>
        <p>
          For everything else:
          <br />
          <a href="mailto:contact@vynr.app">contact@vynr.app</a>
        </p>
        <p>
          vynr is independently developed and maintained by its author.
          Messages are typically answered within a few days.
        </p>
        <p>
          If your email bounces or you do not receive a reply, please resend
          after 24 hours — new domains occasionally take time to propagate
          across mail providers.
        </p>
      </article>
    </section>
  );
}
