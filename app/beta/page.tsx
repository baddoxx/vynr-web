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

        <h2>This build: what&rsquo;s new to test</h2>
        <p>
          This build introduces forward time scrubbing &mdash; likely the
          most significant addition to vynr since launch. It also includes
          improvements across scanning, sharing, and cellar management.
        </p>

        <h3>Forward time scrubbing</h3>
        <p>
          Open the time scrubber (tap the clock icon in the bottom bar).
          Instead of just browsing your cellar&rsquo;s history, you can
          now project forward in time to see which wines are ready to
          drink, which are approaching their peak, and which you&rsquo;re
          about to miss.
        </p>
        <p>
          The readiness ribbon appears immediately &mdash; three
          overlapping curves showing approaching (amber), at peak (green),
          and closing (clay red) wines. Below it, your top appellations
          are ranked by maturity with directive language: &ldquo;drink
          now,&rdquo; &ldquo;don&rsquo;t miss,&rdquo; &ldquo;watch.&rdquo;
        </p>
        <ul>
          <li>
            Open the time scrubber. Does the ribbon and appellation
            stack appear immediately at &ldquo;now&rdquo; without
            needing to drag?
          </li>
          <li>
            Drag the slider right (forward). Do the curves shift? Do
            the counts and appellation rankings update as you scrub?
          </li>
          <li>
            Tap on the ribbon. Does a wine list appear below, grouped
            by maturity state with coloured dots? Does it replace the
            appellation stack?
          </li>
          <li>
            Drag along the ribbon or tap a different region. Does the
            wine list update live without dismissing?
          </li>
          <li>
            Tap an appellation name (e.g. &ldquo;Meursault&rdquo;).
            Does the list filter to wines from that region? Does the
            header show the appellation name with a count summary?
          </li>
          <li>
            With an appellation focused, drag the time slider. Does
            the list update live for the focused appellation?
          </li>
          <li>
            Tap a wine in the list. Does it open the wine detail view
            with a back chevron to return?
          </li>
          <li>
            Swipe right on the wine list (or tap &ldquo;Overview&rdquo;).
            Does it return to the appellation stack and clear the
            ribbon selection?
          </li>
          <li>
            Drag the slider left past &ldquo;now.&rdquo; Does the
            ribbon disappear and the treemap return? The boundary
            between past and future should feel distinct.
          </li>
          <li>
            If you have wines with manually set drink windows (set
            via Edit on the wine detail page), does the forward
            scrubber respect those windows instead of the generic
            appellation estimate?
          </li>
        </ul>
        <p>
          <strong>What to look for:</strong> The system should feel
          like one continuous surface. Scrubbing, tapping, and focusing
          should all flow without modal pop-ups or resets. If anything
          feels disconnected &mdash; a list that doesn&rsquo;t update,
          a count that doesn&rsquo;t match, a wine in the wrong group
          &mdash; report it. Consistency across every surface is the
          most important quality for this feature.
        </p>

        <h3>AI Fix This (sparkles button)</h3>
        <p>
          After scanning a wine label, look for the sparkles button above
          the Add to Cellar button. It shows a badge count of empty
          fields. Tap it to request AI-assisted corrections.
        </p>
        <ul>
          <li>
            Scan a wine where the parser misses fields &mdash; no
            producer, no geography, no colour. Does the sparkles button
            appear? Does the badge count match the number of empty fields?
          </li>
          <li>
            Tap the sparkles button. Does the AI fill in missing fields
            correctly? Are the suggestions reasonable?
          </li>
          <li>
            After AI fills fields, manually edit one (e.g. change the
            producer). Tap sparkles again. Does the AI respect your edit
            and not overwrite it?
          </li>
          <li>
            Long-press the sparkles button for review mode &mdash; you
            see each correction individually before accepting.
          </li>
        </ul>

        <h3>Wine image replacement</h3>
        <p>
          You can now replace a wine&rsquo;s label photo after capture.
          Open a wine&rsquo;s detail page, tap Edit Details, then tap the
          label image at the top. Choose a new photo from your library or
          take a new one with the camera. Save to commit the change.
        </p>
        <ul>
          <li>Does the new image preview appear in the edit sheet?</li>
          <li>Does saving persist the replacement correctly?</li>
          <li>Does cancelling the edit leave the original image intact?</li>
        </ul>

        <h3>Shared cellar label images</h3>
        <p>
          When sharing your cellar via QR code or link, wine label images
          are now included. The shared web page shows label thumbnails for
          each wine.
        </p>
        <ul>
          <li>
            Share a cellar with 5+ wines that have label images. Open
            the link &mdash; do the images appear in the web view?
          </li>
          <li>
            Scan a vynr QR code with your phone camera. Does the app
            detect it and offer to import the cellar?
          </li>
        </ul>

        <h3>Consuming from cellar</h3>
        <p>
          Fixed a crash when consuming the last bottle of a wine. Test
          this by adding a wine with quantity 1, then logging a tasting
          from the cellar. The wine should move out of the cellar
          cleanly without crashing.
        </p>

        <h3>Scan diagnostics</h3>
        <p>
          A new diagnostic view lets you see exactly what the scanner
          detected. Open a wine&rsquo;s detail page, tap the overflow
          menu (&#8943; button in the header), and select
          &ldquo;Capture Details&rdquo;. This shows OCR output, pipeline
          decisions, and spatial analysis. From there you can also
          &ldquo;Send to Support&rdquo; to share the diagnostic bundle.
        </p>

        <h3>What to look for</h3>
        <ul>
          <li>
            Does the AI Fix button appear on wines where the parser
            missed fields? Does it stay hidden when everything is
            already filled in?
          </li>
          <li>
            Are AI corrections accurate? Especially geography &mdash;
            does it get the right appellation from garbled OCR text?
          </li>
          <li>
            Do shared cellars render correctly with label images in
            Safari, Chrome, and on mobile?
          </li>
          <li>
            Can you consume the last bottle of a wine without issues?
          </li>
          <li>
            Any layout or interaction issues on your device?
          </li>
        </ul>

        <hr />

        <h2>Where else to push the system</h2>
        <p>
          Beyond the new features above, actively stress these areas:
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
          vintage, incorrect cuvée &mdash; use the built-in diagnostic tools.
          On the Add to Cellar screen, <strong>long-press the small label
          photo</strong> at the top to send a diagnostic bundle directly via
          Send to Support. After saving the wine, you can also open its
          detail page and use the overflow menu &rarr; Capture Details for a
          detailed view of what the scanner detected.
        </p>

        <h3>Education or reference-data issues</h3>
        <p>
          Education panels have a pencil button (Contribute). Use it to report
          incorrect appellation or regional information, wrong grape data,
          missing producers, or unclear educational text. Reference-data
          corrections are especially valuable during beta.
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
