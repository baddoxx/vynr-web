import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts, getPostBySlug } from "@/lib/posts";
import type { WineData } from "@/lib/posts";
import { remark } from "remark";
import html from "remark-html";
import WineCard from "@/app/components/WineCard";

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      ...(post.heroImage && { images: [{ url: post.heroImage }] }),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      ...(post.heroImage && { images: [post.heroImage] }),
    },
  };
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  const wines: WineData[] = (post as { wines?: WineData[] }).wines ?? [];
  const isJournal = (post as { type?: string }).type === "journal";

  // Split content into segments: text and wine placeholders
  const winePattern = /\[WINE:\s*([a-z0-9\-]+)\s*\]/g;
  type Segment = { type: "text"; content: string } | { type: "wine"; id: string };
  const segments: Segment[] = [];
  let lastIndex = 0;

  const content = post.content;
  let match: RegExpExecArray | null;
  while ((match = winePattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", content: content.slice(lastIndex, match.index) });
    }
    segments.push({ type: "wine", id: match[1] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) {
    segments.push({ type: "text", content: content.slice(lastIndex) });
  }

  // If no wine tokens found, treat entire content as a single text segment
  if (segments.length === 0) {
    segments.push({ type: "text", content });
  }

  // Render each text segment through remark
  const renderedSegments = await Promise.all(
    segments.map(async (seg) => {
      if (seg.type === "text") {
        const processed = await remark().use(html).process(seg.content);
        return { type: "html" as const, html: processed.toString() };
      }
      return { type: "wine" as const, id: seg.id };
    })
  );

  // Wrap inline images — journal posts use full-width style, editorial posts use memory-shot
  const cropPositions = ["top", "center", "bottom"];
  let imageCount = 0;

  const processedSegments = renderedSegments.map((seg) => {
    if (seg.type !== "html") return seg;
    const wrapped = seg.html.replace(
      /<p>\s*<img\s+([^>]*?)\/?\s*>\s*<\/p>/g,
      (_match, attrs) => {
        imageCount++;
        if (isJournal) {
          return `<div class="journal-photo"><img ${attrs}></div>`;
        }
        const parity = (imageCount - 1) % 2 === 0 ? "odd" : "even";
        const pos = cropPositions[imageCount - 1] || "center";
        return `<div class="memory-shot memory-shot-${parity} memory-shot-pos-${pos}"><img ${attrs}></div>`;
      }
    );
    return { type: "html" as const, html: wrapped };
  });

  // Inject hero image at the start of content
  const heroAlt = post.heroAlt || post.title;
  if (post.heroImage && processedSegments.length > 0) {
    if (isJournal) {
      // Journal posts: centered block image, same style as inline journal photos
      const heroHtml = `<div class="journal-photo"><img src="${post.heroImage}" alt="${heroAlt.replace(/"/g, "&quot;")}" /></div>`;
      const first = processedSegments[0];
      if (first.type === "html") {
        processedSegments[0] = { type: "html", html: heroHtml + first.html };
      } else {
        // First segment is a wine card — prepend as its own html segment
        processedSegments.unshift({ type: "html" as const, html: heroHtml });
      }
    } else {
      // Editorial posts: floated right, text wraps around
      const heroHtml = `<figure class="hero-float"><img src="${post.heroImage}" alt="${heroAlt.replace(/"/g, "&quot;")}" />${post.heroAlt ? `<figcaption class="journal-caption">${post.heroAlt}</figcaption>` : ""}</figure>`;
      const first = processedSegments[0];
      if (first.type === "html") {
        processedSegments[0] = { type: "html", html: heroHtml + first.html };
      }
    }
  }

  return (
    <section
      style={{
        maxWidth: isJournal ? 480 : 720,
        margin: "0 auto",
        padding: "48px 24px 80px",
      }}
    >
      <Link
        href="/blog"
        style={{
          display: "inline-block",
          fontSize: "0.8rem",
          color: "var(--atlas-tint)",
          textDecoration: "none",
          marginBottom: "2rem",
          letterSpacing: "0.02em",
        }}
      >
        <span aria-hidden="true">&larr;</span> Blog
      </Link>

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
          {post.title}
        </h1>
        <time
          style={{
            fontSize: "0.8rem",
            color: "var(--atlas-text-placeholder)",
            letterSpacing: "0.02em",
          }}
        >
          {formatDate(String(post.date))}
        </time>
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
        {processedSegments.map((seg, i) => {
          if (seg.type === "html") {
            return <div key={i} dangerouslySetInnerHTML={{ __html: seg.html }} />;
          }
          const wine = wines.find((w) => w.id === seg.id);
          if (!wine) return null;
          return <WineCard key={i} wine={wine} />;
        })}
      </article>
    </section>
  );
}
