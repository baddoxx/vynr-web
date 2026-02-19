import Link from "next/link";
import { getAllPosts, getPostBySlug } from "@/lib/posts";
import { remark } from "remark";
import html from "remark-html";

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
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

  const processedContent = await remark().use(html).process(post.content);
  const rawHtml = processedContent.toString();

  // Wrap inline images in memory-shot containers with alternating layout
  // Crop positions: 1st=top, 2nd=center (show the map), 3rd=bottom
  const cropPositions = ["top", "center", "bottom"];
  let imageCount = 0;
  let articleHtml = rawHtml.replace(
    /<p>\s*<img\s+([^>]*?)\/?\s*>\s*<\/p>/g,
    (_match, attrs) => {
      const parity = imageCount % 2 === 0 ? "odd" : "even";
      const pos = cropPositions[imageCount] || "center";
      imageCount++;
      return `<div class="memory-shot memory-shot-${parity} memory-shot-pos-${pos}"><img ${attrs}></div>`;
    }
  );

  // Inject hero image at the start of article content so text wraps around it
  if (post.heroImage) {
    const heroHtml = `<figure class="hero-float"><img src="${post.heroImage}" alt="${(post.heroAlt || post.title).replace(/"/g, "&quot;")}" />${post.heroAlt ? `<figcaption class="journal-caption">${post.heroAlt}</figcaption>` : ""}</figure>`;
    articleHtml = heroHtml + articleHtml;
  }

  return (
    <section
      style={{
        maxWidth: 720,
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
        &larr; Blog
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

      <article
        className="prose"
        dangerouslySetInnerHTML={{ __html: articleHtml }}
      />
    </section>
  );
}
