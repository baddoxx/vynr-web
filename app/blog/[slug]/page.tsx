import Link from "next/link";
import Image from "next/image";
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

  // Wrap inline images in memory-shot containers with alternating triangles
  let imageCount = 0;
  const contentHtml = rawHtml.replace(
    /<p>\s*<img\s+([^>]*?)\/?\s*>\s*<\/p>/g,
    (_match, attrs) => {
      imageCount++;
      const parity = imageCount % 2 === 1 ? "odd" : "even";
      return `<div class="memory-shot memory-shot-${parity}"><img ${attrs}></div>`;
    }
  );

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
        &larr; Journal
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

      {post.heroImage && (
        <figure style={{ marginBottom: "3rem" }}>
          <Image
            src={post.heroImage}
            alt={post.heroAlt || post.title}
            width={320}
            height={370}
            className="journal-hero"
            style={{ width: "100%", height: "auto" }}
          />
          {post.heroAlt && (
            <figcaption className="journal-caption">{post.heroAlt}</figcaption>
          )}
        </figure>
      )}

      <article
        className="prose"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
    </section>
  );
}
