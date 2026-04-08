import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Beta Guide",
  description:
    "Orientation guide for vynr TestFlight testers. How to use the beta, what to expect, and how to give useful feedback.",
  robots: { index: false, follow: false },
};

export default function BetaPage() {
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
          Beta Guide
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
        <h2>What this is</h2>
        <p>
          vynr is in active beta. The app is incomplete, evolving, and
          occasionally wrong. Features will change. Data may need correcting.
          Some things won&rsquo;t work yet.
        </p>
        <p>
          By using the beta, you are participating in shaping the system. Your
          corrections, observations, and feedback directly influence what vynr
          becomes.
        </p>

        <hr />

        <h2>How to use this beta</h2>
        <p>
          This is the most important section on this page.
        </p>
        <p>
          <strong>In your first session, do all of the following:</strong>
        </p>
        <ol>
          <li>Scan 3&ndash;5 wine labels.</li>
          <li>
            Review and correct the extracted data for each one. Do not skip
            this &mdash; corrections are how the system improves.
          </li>
          <li>Explore at least one region in the Atlas.</li>
          <li>Record at least one journal entry.</li>
        </ol>
        <p>
          Do not just browse. Add real wines. Correct what the scanner gets
          wrong. Build a small cellar. If something parses incorrectly, fix it
          and report it.
        </p>
        <p>
          Correction is not a workaround. It is part of the system. When you
          fix a producer name or select the right appellation from the atlas,
          you are doing exactly what the app is designed for. Every correction
          you make teaches us where the parser and reference data need work.
        </p>

        <hr />

        <h2>The core model: atlas-first</h2>
        <p>
          This is the single most important concept in vynr.
        </p>
        <p>
          Every wine in the system is anchored to structured geography: a
          country, a region, an appellation. This is not a tagging system. It
          is the organising principle of the entire app. The atlas is not a
          feature &mdash; it is the system. Navigation, grouping, education,
          and your cellar map all depend on it.
        </p>
        <p>
          When adding a wine, you will see suggestions drawn from the atlas.
          <strong>Always select from these suggestions.</strong> Atlas
          selections give the wine a precise identity: consistent naming,
          correct hierarchy, and meaningful connections to other wines from the
          same place.
        </p>
        <p>
          <strong>Do not free-type geography or producer names when a
          suggestion exists.</strong> Free text creates orphaned entries that
          cannot participate in navigation, grouping, or education. If the
          atlas offers a match &mdash; even an imperfect one &mdash; select it.
          If no match exists, free text is fine, and reporting the gap is
          valuable.
        </p>

        <hr />

        <h2>Ingesting a wine</h2>
        <p>
          There are two ways to add a wine: scanning a label with the camera, or
          entering details manually. Both flows converge on the same
          atlas-assisted review screen.
        </p>
        <p>
          <strong>Scanning:</strong> Point the camera at a wine label. The app
          uses on-device OCR to extract text &mdash; vintage, producer,
          appellation, varietal, alcohol. These are suggestions, not facts. The
          scanner is assistive, not authoritative. You review every field and
          confirm or correct before saving.
        </p>
        <p>
          <strong>Manual entry:</strong> Type into atlas-assisted fields. As you
          type, the app offers structured matches from the atlas. Select from
          suggestions wherever possible.
        </p>
        <p>
          Imperfection is expected. Labels are inconsistent, multilingual,
          sometimes illegible. The scanner will make mistakes. Your corrections
          are valuable &mdash; they tell us where the parser needs work and
          where the atlas has gaps.
        </p>

        <hr />

        <h2>Your cellar</h2>
        <p>
          The cellar has two views. The treemap shows your collection as a
          spatial overview &mdash; area represents quantity, colour represents
          wine type. The list view offers quick, linear access to the same data.
          Toggle between them freely.
        </p>
        <p>
          Navigation is hierarchical. Tap into a country to see its regions, a
          region to see its appellations, an appellation to see individual wines.
          The breadcrumb bar at the bottom always shows where you are. Tap any
          segment to jump back.
        </p>

        <hr />

        <h2>Atlas as a discovery layer</h2>
        <p>
          Long-press any geography node &mdash; a country, region, or
          appellation &mdash; to explore it. The atlas teaches through structure:
          what grows here, how this place relates to its neighbours, what makes
          it distinct. Learning happens through the same navigation you use to
          manage your cellar.
        </p>
        <p>
          The atlas is both the navigation system and the education system. There
          is no separate reference section. Understanding is built into the same
          surfaces you use every day.
        </p>

        <hr />

        <h2>Journal and taste memory</h2>
        <p>
          The journal captures experiences, not just ratings. A tasting note, a
          context, a moment. Over time, your entries build a personal taste
          profile &mdash; patterns of preference that emerge from what
          you&rsquo;ve recorded, not from what you&rsquo;ve scored.
        </p>
        <p>
          You can log a tasting for any wine &mdash; whether it&rsquo;s in your
          cellar or not. The journal is not limited to what you own.
        </p>

        <hr />

        <h2>Filters and search</h2>
        <p>
          Filter your cellar by wine type, region, or varietal. Search is fuzzy
          &mdash; partial matches and minor misspellings are handled. Filters
          and search work together: filter narrows the scope, search finds
          within it.
        </p>

        <hr />

        <h2>This build: sharing &amp; the web atlas</h2>
        <p>
          This release introduces <strong>cellar sharing</strong> and a
          public <strong>web atlas</strong>. These are the areas we need
          tested most right now.
        </p>

        <h3>Share your cellar</h3>
        <ol>
          <li>
            Open your cellar and tap the share action. Choose
            &ldquo;Share Cellar Snapshot&rdquo;.
          </li>
          <li>
            A shareable link and QR code are generated. Try both:
            <ul>
              <li>Send the link to someone (or yourself) and open it in Safari.</li>
              <li>Save or screenshot the QR code, then scan it with your phone&rsquo;s camera.</li>
            </ul>
          </li>
          <li>
            The shared cellar should open as a web page at
            {" "}<strong>vynr.app</strong> &mdash; a read-only treemap of your
            collection. Verify that the wines, regions, and hierarchy
            look correct.
          </li>
        </ol>
        <p>
          Try sharing cellars of different sizes &mdash; small (3&ndash;5 wines),
          medium (20+), and large (50+). Check that the treemap renders
          cleanly and that navigation into regions works.
        </p>

        <h3>Web atlas pages</h3>
        <p>
          The atlas is now browsable on the web at{" "}
          <a href="https://vynr.app/atlas" style={{ color: "var(--atlas-tint)" }}>vynr.app/atlas</a>.
          Explore regions, drill into countries and appellations, and
          check that education content appears correctly. Report any
          missing or incorrect information using the feedback channels
          below.
        </p>

        <h3>What to look for</h3>
        <ul>
          <li>
            Does the shared cellar link work in Safari, Chrome, and
            other browsers?
          </li>
          <li>
            Does the QR code scan correctly and open the right page?
          </li>
          <li>
            Is the treemap on the shared page readable and navigable?
          </li>
          <li>
            Does the web atlas show education content (description,
            grapes, style) when you tap into a region?
          </li>
          <li>
            Any layout or rendering issues on mobile vs desktop?
          </li>
        </ul>

        <hr />

        <h2>Where else to push the system</h2>
        <p>
          Beyond sharing, actively stress these areas:
        </p>

        <h3>Ingestion edge cases</h3>
        <ul>
          <li>
            Scan difficult labels &mdash; low light, unusual layouts,
            non-standard regions, non-French languages
          </li>
          <li>
            Override OCR suggestions and select from the Atlas manually
          </li>
        </ul>

        <h3>Navigation and discovery</h3>
        <ul>
          <li>
            Move between treemap and list views using the pinch gesture
          </li>
          <li>
            Drill into regions, then long-press breadcrumb segments for
            deeper context
          </li>
          <li>
            Swipe left and right across related regions inside education
            panels
          </li>
        </ul>

        <h3>Journal and time navigation</h3>
        <ul>
          <li>
            Record a tasting using the full structured flow, not just a
            quick note
          </li>
          <li>
            Use the time lens to move between entries across different
            periods
          </li>
        </ul>

        <h3>Enrichment and output</h3>
        <ul>
          <li>Add drink windows and intent tags to wines</li>
          <li>Export a journal entry as a polaroid share</li>
          <li>
            If enabled: generate AI commentary and try switching tone
          </li>
        </ul>

        <hr />

        <h2>What will break</h2>
        <p>
          These are normal and expected in the current beta:
        </p>
        <ul>
          <li>
            OCR inaccuracies &mdash; misread characters, missing fields,
            incorrect language detection
          </li>
          <li>
            Missing producers or regions in the atlas &mdash; the reference data
            is growing but incomplete
          </li>
          <li>
            Incorrect or absent suggestions during ingestion
          </li>
          <li>
            Layout or interaction issues on certain screen sizes
          </li>
        </ul>
        <p>
          None of this is unusual for a beta. Report what you find. Don&rsquo;t
          assume someone else has seen it.
        </p>

        <hr />

        <h2>How to give useful feedback</h2>
        <p>
          Every report must include:
        </p>
        <ul>
          <li>
            <strong>Build number</strong> (Settings &rarr; About vynr)
          </li>
          <li>
            <strong>What you did</strong> &mdash; the action that led to the
            issue
          </li>
          <li>
            <strong>What you expected</strong> to happen
          </li>
          <li>
            <strong>What happened instead</strong>
          </li>
          <li>
            <strong>A screenshot</strong>
          </li>
        </ul>
        <p>
          Reports without this structure are difficult to act on. Be specific.
        </p>

        <h3>Label scanning or parsing failures</h3>
        <p>
          If a scan produces wrong results &mdash; wrong producer, missing
          vintage, incorrect cuvée &mdash; use the built-in diagnostic tool.
          On the Add to Cellar screen, find the small scanned label photo at
          the top. <strong>Long-press the small photo directly</strong> (do not
          tap it first), then tap Send to Support. This sends the image and
          technical details needed to investigate the failure.
        </p>

        <h3>Education or reference-data issues</h3>
        <p>
          Every education panel has an Edit button. Use it to report incorrect
          appellation or regional information, wrong grape data, missing
          producers, or unclear educational text. Reference-data corrections are
          especially valuable during beta.
        </p>

        <h3>Crashes, freezes, or general issues</h3>
        <p>
          Shake your device or take a screenshot and tap the share prompt to
          use TestFlight&rsquo;s built-in feedback. You can also email
          directly: <a href="mailto:support@vynr.app">support@vynr.app</a>.
        </p>

        <h3>What makes feedback valuable</h3>
        <p>
          Edge cases are as useful as outright failures. A suggestion that was
          almost right, a field that felt ambiguous, a flow that made you
          hesitate &mdash; these are all worth reporting. Corrections you make
          during ingestion tell us exactly where the parser or reference data
          needs work.
        </p>
        <p>
          Reference data can update in the background without an app update.
          If you see a &ldquo;Reference data updated&rdquo; toast, that means
          a fix was pushed for something you or another tester reported.
        </p>
      </article>
    </section>
  );
}
