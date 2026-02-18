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
          vynr is designed to be calm, private, and user-owned. This policy
          explains what data vynr processes, where it is stored, and what
          choices you have.
        </p>

        <h2>Summary</h2>
        <ul>
          <li>
            <strong>Your cellar and journal data stays yours.</strong> By
            default, it is stored on-device.
          </li>
          <li>
            <strong>If you enable CloudKit sync,</strong> your data is stored in{" "}
            <strong>your iCloud account</strong> and synced by Apple.
          </li>
          <li>
            <strong>If you use AI Commentary,</strong> vynr sends a small,
            non-identifying context payload to a proxy service that calls an LLM
            provider and returns text.{" "}
            <strong>
              Personal tasting content is not sent unless you explicitly enable
              that tier in the app.
            </strong>
          </li>
          <li>
            <strong>
              No ads. No selling your data. No affiliate shopping funnels.
            </strong>
          </li>
        </ul>

        <h2>Who we are</h2>
        <ul>
          <li>
            <strong>Controller:</strong> Richard Docksey (publisher of vynr)
          </li>
          <li>
            <strong>Contact:</strong>{" "}
            <a href="mailto:vynr@reallyfast.biz">vynr@reallyfast.biz</a>
          </li>
        </ul>

        <h2>Data vynr processes</h2>

        <h3>1. Data you create in the app</h3>
        <p>
          vynr processes the information you enter or capture, including:
        </p>
        <ul>
          <li>
            <strong>Cellar inventory:</strong> bottles you own, quantities,
            storage location/cellar name, purchase notes (if you add them)
          </li>
          <li>
            <strong>Wine details:</strong> producer, cuvee, vintage,
            region/appellation mapping, grape/style metadata (where available)
          </li>
          <li>
            <strong>Journal / WineExperience:</strong> ratings, tasting notes,
            optional photos you attach
          </li>
          <li>
            <strong>User annotations:</strong> notes you attach to atlas nodes
            (if enabled)
          </li>
        </ul>
        <p>
          <strong>Purpose:</strong> to provide core functionality (cellar
          management, journaling, navigation, and search).
        </p>

        <h3>2. Photos and OCR</h3>
        <p>
          If you use label scanning, vynr processes photos on-device to extract
          text and propose wine fields.
        </p>
        <ul>
          <li>
            <strong>Photos are stored only if you choose to attach them</strong>{" "}
            to a wine or experience.
          </li>
          <li>
            If you do not attach a photo, it may be processed transiently and
            then discarded.
          </li>
        </ul>
        <p>
          <strong>Purpose:</strong> wine ingestion and field extraction.
        </p>

        <h3>3. CloudKit sync (optional)</h3>
        <p>
          If you enable CloudKit sync, vynr stores and syncs your vynr data
          using Apple CloudKit.
        </p>
        <ul>
          <li>
            Data is stored in <strong>your iCloud account</strong>.
          </li>
          <li>
            Apple acts as the service provider for synchronization and storage.
          </li>
        </ul>
        <p>
          <strong>Purpose:</strong> backup and multi-device sync.
        </p>

        <h3>4. AI Commentary (optional)</h3>
        <p>
          If you tap <strong>Ask AI</strong> in an education panel, vynr
          requests an AI commentary response. By tapping this button, you
          request that vynr transmit the specific data described below to the
          third-party services listed in this policy.
        </p>
        <p>
          <strong>Tier 1 (Reference / Atlas context):</strong>
        </p>
        <ul>
          <li>
            Sent: atlas node identifier, curated education text (if present),
            and selected non-personal context fields (e.g., wine type lens like
            &ldquo;Sparkling&rdquo;, or concept lenses like &ldquo;Left
            Bank&rdquo; when applicable).
          </li>
          <li>
            Not sent: your identity, device identifiers, your photos, your
            purchase price, timestamps, location, companions, or any other
            personal fields.
          </li>
        </ul>
        <p>
          <strong>Tier 2 (Experience context):</strong>
        </p>
        <ul>
          <li>
            <strong>Disabled by default.</strong> If enabled in the future, it
            may send <strong>explicitly whitelisted</strong> non-identifying
            tasting fields (e.g., your note text and rating) to tailor
            commentary.
          </li>
          <li>
            It will not send photos, companions, precise location, or other
            identifying metadata.
          </li>
        </ul>
        <p>
          <strong>How delivery works today:</strong>
        </p>
        <ul>
          <li>
            Your request is sent to a <strong>Cloudflare Worker proxy</strong>{" "}
            (to keep provider API keys out of the app).
          </li>
          <li>
            The proxy calls the configured LLM provider and returns text to your
            device.
          </li>
          <li>
            The proxy may cache <strong>Tier 1</strong> results keyed by atlas
            node + lens context to reduce cost and latency.
          </li>
        </ul>
        <p>
          <strong>Purpose:</strong> provide optional interpretive commentary to
          complement (not replace) curated reference content.
        </p>

        <h3>5. Diagnostics</h3>
        <p>vynr does not include third-party analytics SDKs.</p>
        <p>
          If you have opted in to share diagnostics with app developers via your
          device settings (Settings &gt; Privacy &amp; Security &gt; Analytics
          &amp; Improvements), Apple may share anonymized crash logs and
          performance data with us through App Store Connect. This data is
          provided by Apple in anonymized and/or aggregated form and is not
          intended to identify you.
        </p>
        <p>
          <strong>Purpose:</strong> app stability and bug fixing.
        </p>

        <h3>6. Anonymous usage data (optional)</h3>
        <p>
          If you enable <strong>&ldquo;Share anonymous usage data&rdquo;</strong>{" "}
          in Settings, vynr collects anonymous, aggregate product interaction
          counts &mdash; for example, which modes are used and how often
          features like AI Commentary are activated.
        </p>
        <ul>
          <li>
            Data consists only of <strong>event counters</strong> (e.g.,
            &ldquo;atlas mode entered: 12 times today&rdquo;). No text, photos,
            identifiers, wine names, tasting notes, or personal content is
            included.
          </li>
          <li>
            Counters are sent in a single batch at the end of each session to a{" "}
            <strong>dedicated Cloudflare Worker</strong> (
            <code>vynr-telemetry</code>), separate from the AI commentary proxy.
          </li>
          <li>
            The Worker increments date-bucketed counters and{" "}
            <strong>discards the raw event payload</strong>. Only aggregate
            counters are stored.
          </li>
          <li>
            Counters <strong>auto-expire after 30 days</strong>.
          </li>
          <li>
            No user identifiers, device identifiers, or IP addresses are stored.
            Cloudflare processes IPs transiently for request routing (inherent
            to HTTP); the Worker does not read, log, or store them.
          </li>
          <li>
            This toggle is <strong>off by default</strong>. No usage data is
            collected unless you enable it.
          </li>
        </ul>
        <p>
          <strong>Purpose:</strong> understand which features provide value and
          guide product improvement.
        </p>

        <h2>What we do not do</h2>
        <ul>
          <li>We do not sell personal data.</li>
          <li>We do not run behavioral advertising.</li>
          <li>
            We do not add &ldquo;shopping cart&rdquo; flows or affiliate
            funnels.
          </li>
          <li>
            We do not use your private cellar/journal data to train public
            models.
          </li>
        </ul>

        <h2>Third-party services</h2>
        <p>Depending on features you enable, vynr may use:</p>
        <ul>
          <li>
            <strong>Apple iCloud / CloudKit</strong> (optional): for sync and
            backup.
          </li>
          <li>
            <strong>Cloudflare Workers / KV</strong> (AI proxy, optional):
            request routing, caching, and rate limiting.
          </li>
          <li>
            <strong>Cloudflare Workers / KV</strong> (telemetry, optional):
            anonymous counter aggregation and storage.
          </li>
          <li>
            <strong>LLM provider (e.g., OpenAI)</strong> (AI commentary,
            optional): generation of commentary text.
          </li>
        </ul>
        <p>
          We select providers whose handling of data is consistent with this
          policy, and we minimize what is sent. AI Commentary requests exclude
          identity and device identifiers; Tier 1 responses are cacheable and
          contain no personal data, and Tier 2 is opt-in with a whitelisted
          field set.
        </p>

        <h2>Data retention</h2>
        <ul>
          <li>
            <strong>On-device data:</strong> retained until you delete it in the
            app or uninstall the app.
          </li>
          <li>
            <strong>CloudKit data (if enabled):</strong> retained in your iCloud
            account until you delete it or disable sync (Apple may retain
            deleted data for a limited period as part of iCloud operations).
          </li>
          <li>
            <strong>AI proxy cache (Tier 1 only):</strong> cached responses are
            stored server-side for up to 7 days. Cache entries contain only
            generated text and a cache key derived from the atlas node and lens
            context. No user identifiers, device identifiers, or IP addresses
            are stored with cached content.
          </li>
          <li>
            <strong>Usage data counters (if opted in):</strong> anonymous
            counters stored in Cloudflare KV with a 30-day TTL. Auto-expire.
            Not linked to any user or device.
          </li>
          <li>
            <strong>Apple diagnostics (if opted in):</strong> retained and
            governed by Apple&apos;s privacy policy.
          </li>
        </ul>

        <h2>Your choices and controls</h2>
        <ul>
          <li>You can use vynr without CloudKit sync.</li>
          <li>
            You can enable or disable AI Commentary at any time in Settings.
          </li>
          <li>
            You can enable or disable anonymous usage data sharing at any time
            in Settings.
          </li>
          <li>You can clear local AI commentary cache from Settings.</li>
          <li>
            You can delete wines, experiences, photos, and annotations inside
            the app.
          </li>
          <li>
            If you enable CloudKit, you can manage iCloud storage and data via
            your Apple ID settings.
          </li>
        </ul>

        <h3>Data deletion</h3>
        <p>
          vynr does not operate user accounts or store your cellar, journal, or
          personal data on vynr-controlled servers. The AI commentary cache
          (hosted by Cloudflare) contains only generated text keyed by atlas
          node &mdash; it is not linked to any user or device.
        </p>
        <ul>
          <li>
            <strong>On-device data:</strong> delete individual items within the
            app, or uninstall vynr to remove all local data.
          </li>
          <li>
            <strong>Local AI cache:</strong> clear from Settings at any time.
          </li>
          <li>
            <strong>Server-side AI cache:</strong> entries expire automatically
            within 7 days. Because cache entries are not linked to users, there
            is no per-user data to delete.
          </li>
          <li>
            <strong>CloudKit data:</strong> manage via your Apple ID settings
            (Settings &gt; Apple Account &gt; iCloud).
          </li>
        </ul>
        <p>
          For any other data-related questions or requests, contact us at{" "}
          <a href="mailto:vynr@reallyfast.biz">vynr@reallyfast.biz</a>.
        </p>

        <h2>Children</h2>
        <p>vynr is intended for adults of legal drinking age.</p>

        <h2>Legal basis for processing</h2>
        <ul>
          <li>
            <strong>Core functionality</strong> (cellar, journal, atlas, OCR):
            processing is necessary to provide the service you have requested.
          </li>
          <li>
            <strong>CloudKit sync</strong>: processing is based on your choice
            to enable sync.
          </li>
          <li>
            <strong>AI Commentary</strong>: processing is based on your explicit
            action (tapping &ldquo;Ask AI&rdquo;).
          </li>
          <li>
            <strong>Usage data</strong>: processing is based on your choice to
            enable the toggle in Settings.
          </li>
        </ul>

        <h2>International transfers</h2>
        <p>
          If you use AI Commentary or enable usage data sharing, requests may be
          processed in regions where Cloudflare or the LLM provider operates.
          This depends on provider infrastructure and may vary.
        </p>

        <h2>Changes to this policy</h2>
        <p>
          We may update this policy as vynr evolves. If changes are material, we
          will update the effective date and (where practical) surface an in-app
          notice.
        </p>

        <h2>Contact</h2>
        <p>
          For privacy questions or data deletion requests, contact:{" "}
          <a href="mailto:vynr@reallyfast.biz">vynr@reallyfast.biz</a>
        </p>
      </article>
    </section>
  );
}
