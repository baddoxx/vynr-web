import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPage() {
  const posts = getAllPosts();

  return (
    <section
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "48px 24px 80px",
      }}
    >
      <h1
        style={{
          fontSize: "1.8rem",
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: "var(--atlas-text)",
          marginBottom: "0.5rem",
        }}
      >
        Blog
      </h1>
      <p
        style={{
          fontSize: "0.9rem",
          color: "var(--atlas-text-placeholder)",
          marginBottom: "3rem",
        }}
      >
        Notes on wine, place, and memory.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="blog-post-link"
            style={{
              display: "block",
              textDecoration: "none",
              padding: "1.5rem 0",
              borderBottom: "none",
            }}
          >
            <article>
              <h2
                style={{
                  fontSize: "1.15rem",
                  fontWeight: 600,
                  color: "var(--atlas-text)",
                  marginBottom: "0.4rem",
                  letterSpacing: "-0.01em",
                }}
              >
                {post.title}
              </h2>
              <p
                style={{
                  fontSize: "0.925rem",
                  color: "var(--atlas-text-secondary)",
                  lineHeight: 1.5,
                  marginBottom: "0.5rem",
                }}
              >
                {post.description}
              </p>
              <time
                style={{
                  fontSize: "0.8rem",
                  color: "var(--atlas-text-placeholder)",
                  letterSpacing: "0.02em",
                }}
              >
                {formatDate(post.date)}
              </time>
            </article>
          </Link>
        ))}
      </div>
    </section>
  );
}
