import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How vynr handles your data.",
};

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p
          style={{
            fontSize: "0.8rem",
            color: "var(--atlas-text-placeholder)",
            letterSpacing: "0.02em",
          }}
        >
          Effective date: February 7, 2026
        </p>
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
          vynr is a private personal wine journal. The app is designed so that
          most of your information stays on your device and under your control.
        </p>

        <h2>What data vynr stores</h2>
        <p>You may create the following information inside the app:</p>
        <ul>
          <li>Cellar entries (bottles, quantities, and notes)</li>
          <li>Tasting notes and ratings</li>
          <li>Optional photos you attach</li>
          <li>Optional personal annotations</li>
        </ul>
        <p>
          This information exists only to provide the core features of the app
          (cellar tracking, journaling, and search). It is not publicly
          visible and is not sold or shared for advertising purposes.
        </p>

        <h2>Where your data lives</h2>
        <ul>
          <li>
            By default, your data is stored locally on your device.
          </li>
          <li>
            If you enable iCloud sync, the data is stored in your personal
            iCloud account using Apple CloudKit.
          </li>
        </ul>
        <p>
          vynr does not operate user accounts and does not host your cellar or
          journal on our own servers.
        </p>

        <h2>Photos</h2>
        <p>
          Photos are accessed only when you choose them. If you scan a label,
          processing happens on‑device and the image is saved only if you attach
          it to a wine entry.
        </p>

        <h2>AI commentary (optional)</h2>
        <p>
          If you request AI commentary, the app sends limited wine context to a
          proxy service which forwards the request to an AI provider and
          returns text to your device. Personal identifying information is not
          included, and this feature is optional.
        </p>

        <h2>Diagnostics</h2>
        <p>
          The app contains no advertising trackers or third‑party analytics SDKs.
          Apple may provide anonymized crash reports if you enable system
          diagnostic sharing in your device settings.
        </p>

        <h2>What we do not do</h2>
        <ul>
          <li>We do not sell your data.</li>
          <li>We do not track you across apps or websites.</li>
          <li>We do not run advertising networks.</li>
          <li>We do not use your private journal to train public models.</li>
        </ul>

        <h2>Your control</h2>
        <ul>
          <li>You can use the app without iCloud sync.</li>
          <li>You can delete any entry inside the app at any time.</li>
          <li>Uninstalling the app removes local data from the device.</li>
          <li>iCloud data can be managed from your Apple ID settings.</li>
        </ul>

        <h2>Children</h2>
        <p>vynr is intended for adults of legal drinking age.</p>

        <h2>Contact</h2>
        <p>
          For privacy questions, contact: <a href="mailto:contact@vynr.app">contact@vynr.app</a>
        </p>
      </article>
    </section>
  );
}
